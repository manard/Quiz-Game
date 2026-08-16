/**
 * Quiz sound engine.
 *
 * Sounds are synthesised with the Web Audio API instead of shipping audio files,
 * so the game has no binary assets to manage and no network latency before a cue.
 *
 * Two guarantees the game screen relies on:
 *  - Only ONE cue is audible at a time. Starting a cue fades out and stops the
 *    previous one, so sounds never stack or pile up.
 *  - The same cue cannot retrigger within `RETRIGGER_GUARD` seconds, so a
 *    re-render or a fast tap can never machine-gun the same sound.
 */

export type Cue =
  | "question" // a new question appears
  | "select" // an answer was tapped
  | "correct" // answer was right
  | "wrong" // answer was wrong
  | "warning" // timer is running low
  | "timeout" // time ran out
  // --- results reveal ---
  | "tick" // reveal countdown beat
  | "score" // a contestant's score slides in
  | "drumroll" // suspense before the winner is named
  | "fanfare" // the winner is revealed
  | "tie"; // both contestants finished level

const MUTE_STORAGE_KEY = "quiz:sound-muted";
const MASTER_VOLUME = 0.5;
const RETRIGGER_GUARD = 0.15; // seconds

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voice: { gain: GainNode; sources: AudioScheduledSourceNode[] } | null = null;
let lastCue: Cue | null = null;
let lastCueAt = -Infinity;

/* ------------------------------------------------------------------ */
/* Mute state (tiny observable store, consumed via useSyncExternalStore) */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();

function loadMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let muted = typeof window === "undefined" ? false : loadMuted();

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  if (muted === next) return;

  muted = next;

  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* storage unavailable — mute still applies for this session */
  }

  if (next && ctx) {
    stopVoice(ctx.currentTime);
  }

  listeners.forEach((listener) => listener());
}

export function toggleMuted(): void {
  setMuted(!muted);
}

export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ------------------------------------------------------------------ */
/* Audio graph                                                         */
/* ------------------------------------------------------------------ */

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!Ctor) return null;

  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
  }

  // Browsers start the context suspended until a user gesture has happened.
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  return ctx;
}

/**
 * Warm up the audio context. Call this from a screen that is only reachable
 * after a tap, so the very first cue is not swallowed by autoplay policy.
 */
export function primeAudio(): void {
  getContext();
}

function stopVoice(at: number): void {
  if (!voice) return;

  const { gain, sources } = voice;
  voice = null;

  gain.gain.cancelScheduledValues(at);
  gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);

  sources.forEach((source) => {
    try {
      source.stop(at + 0.06);
    } catch {
      /* already stopped */
    }
  });
}

type NoteOptions = {
  freq: number;
  start: number;
  dur: number;
  peak: number;
  type?: OscillatorType;
  glideTo?: number;
  lowpass?: number;
};

function note(
  audio: AudioContext,
  dest: AudioNode,
  sources: AudioScheduledSourceNode[],
  options: NoteOptions
): void {
  const { freq, start, dur, peak, type = "triangle", glideTo, lowpass } = options;

  const osc = audio.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
  }

  const env = audio.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.02, dur * 0.3));
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(env);

  if (lowpass) {
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;
    env.connect(filter);
    filter.connect(dest);
  } else {
    env.connect(dest);
  }

  osc.start(start);
  osc.stop(start + dur + 0.06);
  sources.push(osc);
}

/** White-noise source used for the drum roll, generated once and reused. */
let noiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(audio: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === audio.sampleRate) {
    return noiseBuffer;
  }

  const length = Math.floor(audio.sampleRate * 3);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }

  noiseBuffer = buffer;
  return buffer;
}

type Recipe = (
  audio: AudioContext,
  dest: AudioNode,
  sources: AudioScheduledSourceNode[],
  t0: number
) => void;

/**
 * Every cue is deliberately short (< 0.6s) and mid-volume so it reads as a
 * game-show sting in a classroom rather than a notification chime.
 */
const RECIPES: Record<Cue, Recipe> = {
  // Soft two-note rise — "here comes the question".
  question: (audio, dest, sources, t0) => {
    note(audio, dest, sources, { freq: 587.33, start: t0, dur: 0.16, peak: 0.26 });
    note(audio, dest, sources, {
      freq: 880,
      start: t0 + 0.1,
      dur: 0.3,
      peak: 0.2,
    });
  },

  // Dry, tiny tick — confirms the tap without commenting on the answer.
  select: (audio, dest, sources, t0) => {
    note(audio, dest, sources, {
      freq: 1046.5,
      start: t0,
      dur: 0.06,
      peak: 0.16,
      type: "sine",
    });
    note(audio, dest, sources, {
      freq: 1567.98,
      start: t0 + 0.012,
      dur: 0.045,
      peak: 0.08,
      type: "sine",
    });
  },

  // Bright major arpeggio.
  correct: (audio, dest, sources, t0) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      note(audio, dest, sources, {
        freq,
        start: t0 + index * 0.07,
        dur: 0.32,
        peak: 0.2,
      });
    });
  },

  // Two low, filtered notes falling — disappointed, not punishing.
  wrong: (audio, dest, sources, t0) => {
    note(audio, dest, sources, {
      freq: 196,
      start: t0,
      dur: 0.24,
      peak: 0.17,
      type: "sawtooth",
      lowpass: 900,
    });
    note(audio, dest, sources, {
      freq: 155.56,
      start: t0 + 0.1,
      dur: 0.3,
      peak: 0.15,
      type: "sawtooth",
      lowpass: 800,
    });
  },

  // One clean pip per remaining second in the danger zone.
  warning: (audio, dest, sources, t0) => {
    note(audio, dest, sources, {
      freq: 987.77,
      start: t0,
      dur: 0.08,
      peak: 0.17,
    });
  },

  // Falling siren — unmistakably "time is up".
  timeout: (audio, dest, sources, t0) => {
    note(audio, dest, sources, {
      freq: 392,
      start: t0,
      dur: 0.5,
      peak: 0.2,
      type: "sawtooth",
      glideTo: 98,
      lowpass: 1200,
    });
    note(audio, dest, sources, {
      freq: 110,
      start: t0 + 0.3,
      dur: 0.3,
      peak: 0.14,
      lowpass: 500,
    });
  },

  // Hollow beat for the 3-2-1 countdown before the reveal.
  tick: (audio, dest, sources, t0) => {
    note(audio, dest, sources, {
      freq: 330,
      start: t0,
      dur: 0.14,
      peak: 0.22,
    });
    note(audio, dest, sources, {
      freq: 110,
      start: t0,
      dur: 0.18,
      peak: 0.15,
      lowpass: 600,
    });
  },

  // Rising whoosh + pop as a scoreboard card lands.
  score: (audio, dest, sources, t0) => {
    note(audio, dest, sources, {
      freq: 300,
      start: t0,
      dur: 0.2,
      peak: 0.15,
      type: "sine",
      glideTo: 900,
    });
    note(audio, dest, sources, {
      freq: 1174.66,
      start: t0 + 0.16,
      dur: 0.12,
      peak: 0.16,
    });
  },

  /**
   * Snare-style roll: filtered noise with an accelerating tremolo and a
   * crescendo. Runs ~2.2s and is cut off by whatever cue follows it.
   */
  drumroll: (audio, dest, sources, t0) => {
    const DURATION = 2.2;

    const source = audio.createBufferSource();
    source.buffer = getNoiseBuffer(audio);

    const band = audio.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1900;
    band.Q.value = 0.7;

    const env = audio.createGain();
    env.gain.setValueAtTime(0.0001, t0);

    let time = t0;
    let interval = 0.055;

    while (time < t0 + DURATION) {
      const progress = (time - t0) / DURATION;

      env.gain.exponentialRampToValueAtTime(
        0.09 + progress * 0.22,
        time + interval * 0.35
      );
      env.gain.exponentialRampToValueAtTime(
        0.02 + progress * 0.05,
        time + interval
      );

      time += interval;
      interval = Math.max(0.026, interval * 0.985);
    }

    env.gain.exponentialRampToValueAtTime(0.0001, t0 + DURATION + 0.15);

    source.connect(band);
    band.connect(env);
    env.connect(dest);

    source.start(t0);
    source.stop(t0 + DURATION + 0.25);
    sources.push(source);
  },

  // Victory sting: ascending run into a held major chord.
  fanfare: (audio, dest, sources, t0) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      note(audio, dest, sources, {
        freq,
        start: t0 + index * 0.1,
        dur: 0.26,
        peak: 0.19,
      });
    });

    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq) => {
      note(audio, dest, sources, {
        freq,
        start: t0 + 0.44,
        dur: 1.5,
        peak: 0.11,
      });
    });

    note(audio, dest, sources, {
      freq: 130.81,
      start: t0 + 0.44,
      dur: 1.6,
      peak: 0.15,
      type: "sawtooth",
      lowpass: 600,
    });
  },

  // Warm, unresolved-then-resolved pair for a draw.
  tie: (audio, dest, sources, t0) => {
    [392, 493.88, 587.33].forEach((freq) => {
      note(audio, dest, sources, { freq, start: t0, dur: 0.5, peak: 0.13 });
    });

    [349.23, 440, 523.25].forEach((freq) => {
      note(audio, dest, sources, {
        freq,
        start: t0 + 0.42,
        dur: 1.2,
        peak: 0.13,
      });
    });
  },
};

export function playCue(cue: Cue): void {
  if (muted) return;

  const audio = getContext();
  if (!audio || !master) return;

  const now = audio.currentTime;

  if (cue === lastCue && now - lastCueAt < RETRIGGER_GUARD) return;

  stopVoice(now);

  lastCue = cue;
  lastCueAt = now;

  const gain = audio.createGain();
  gain.gain.value = 1;
  gain.connect(master);

  const sources: OscillatorNode[] = [];
  voice = { gain, sources };

  RECIPES[cue](audio, gain, sources, now);
}
