type TimerRingProps = {
  /** Seconds left, or null before the first tick of a question. */
  seconds: number | null;
  /** The question's full allowance, used to draw the arc. */
  total: number;
};

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular countdown. Purely presentational — it never advances the clock. */
function TimerRing({ seconds, total }: TimerRingProps) {
  const ratio =
    seconds === null || total <= 0
      ? 1
      : Math.min(Math.max(seconds / total, 0), 1);

  let state: "calm" | "warn" | "danger" = "calm";

  if (seconds !== null && seconds <= 5) {
    state = "danger";
  } else if (ratio <= 0.4) {
    state = "warn";
  }

  return (
    <div
      className="q-timer"
      data-state={state}
      role="timer"
      aria-label="الوقت المتبقي"
    >
      <svg className="q-timer__svg" viewBox="0 0 112 112" aria-hidden="true">
        <circle className="q-timer__rail" cx="56" cy="56" r={RADIUS} />
        <circle
          className="q-timer__bar"
          cx="56"
          cy="56"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
        />
      </svg>

      <span className="q-timer__value">{seconds ?? "--"}</span>
      <span className="q-timer__unit">ثانية</span>
    </div>
  );
}

export default TimerRing;
