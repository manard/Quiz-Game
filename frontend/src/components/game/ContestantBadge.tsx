import { initialOf, slotLabel } from "../../lib/contestant";

type ContestantBadgeProps = {
  name: string;
  /** 1 or 2 — drives the gold / cyan identity colour. */
  slot: number;
};

/** Identity chip for the contestant currently on stage. */
function ContestantBadge({ name, slot }: ContestantBadgeProps) {
  return (
    <div className={`q-contestant q-contestant--slot-${slot}`}>
      <span className="q-contestant__avatar" aria-hidden="true">
        {initialOf(name)}
      </span>

      <span className="q-contestant__meta">
        <span className="q-label">{slotLabel(slot)}</span>
        <span className="q-contestant__name">{name}</span>
      </span>
    </div>
  );
}

export default ContestantBadge;
