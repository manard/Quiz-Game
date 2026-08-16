import { useEffect, useState } from "react";

type ScoreCounterProps = {
  target: number;
  /** Counting only starts once this flips to true. */
  active: boolean;
  /** Milliseconds to wait after `active` before the count begins. */
  delayMs?: number;
  durationMs?: number;
};

/** Animated score roll-up. Renders the final value the moment it finishes. */
function ScoreCounter({
  target,
  active,
  delayMs = 0,
  durationMs = 900,
}: ScoreCounterProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const startAt = performance.now() + delayMs;

    function step(now: number) {
      const progress = Math.min(Math.max((now - startAt) / durationMs, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(target * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    }

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [target, active, delayMs, durationMs]);

  return <>{active ? value : 0}</>;
}

export default ScoreCounter;
