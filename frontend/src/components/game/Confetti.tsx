import type { CSSProperties } from "react";

const COLORS = ["#f5c15c", "#7c6cf7", "#4fd6e6", "#2fd69b", "#ff8fa8", "#ffdd9c"];
const PIECE_COUNT = 70;

/**
 * Deterministic pseudo-random in [0, 1). Keeps the burst varied without a real
 * random source, so the piece list can be a pure module-level constant.
 */
function noise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const PIECES = Array.from({ length: PIECE_COUNT }, (_, index) => ({
  id: index,
  left: noise(index + 1) * 100,
  delay: noise(index + 11) * 1.4,
  duration: 2.6 + noise(index + 23) * 2.2,
  drift: (noise(index + 37) - 0.5) * 26,
  spin: 240 + noise(index + 51) * 540,
  scale: 0.6 + noise(index + 67) * 0.8,
  color: COLORS[index % COLORS.length],
  round: index % 5 === 0,
}));

type ConfettiProps = {
  active: boolean;
};

/** Purely decorative celebration burst for the winner reveal. */
function Confetti({ active }: ConfettiProps) {
  if (!active) return null;

  return (
    <div className="q-confetti" aria-hidden="true">
      {PIECES.map((piece) => (
        <span
          key={piece.id}
          className="q-confetti__piece"
          data-round={piece.round ? "true" : "false"}
          style={
            {
              "--q-left": `${piece.left}%`,
              "--q-delay": `${piece.delay}s`,
              "--q-duration": `${piece.duration}s`,
              "--q-drift": `${piece.drift}vw`,
              "--q-spin": `${piece.spin}deg`,
              "--q-scale": piece.scale,
              "--q-color": piece.color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default Confetti;
