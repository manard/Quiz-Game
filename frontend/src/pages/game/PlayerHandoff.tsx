import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { playCue, primeAudio } from "../../lib/sound";
import MuteToggle from "../../components/game/MuteToggle";
import { initialOf, slotLabel } from "../../lib/contestant";

type HandoffState = {
  nextPlayerName?: string;
  previousPlayerName?: string;
};

/**
 * Handoff between contestants.
 *
 * The previous player's turn is already finished on the server by the time we
 * land here. This screen deliberately does NOT auto-advance: the next
 * contestant starts her round only when she presses the start button.
 */
function PlayerHandoff() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId, nextSlot } = useParams();

  const state: HandoffState = (location.state as HandoffState) || {};

  const slot = Number(nextSlot) === 2 ? 2 : 1;
  const nextName: string = state.nextPlayerName?.trim() || "";
  const previousName: string = state.previousPlayerName?.trim() || "";

  useEffect(() => {
    primeAudio();
    playCue("question");
  }, []);

  function handleStart() {
    playCue("select");
    navigate(`/game/session/${sessionId}/player/${slot}`);
  }

  return (
    <div dir="rtl" className="q-scope q-stage q-stage--center">
      <div className="q-panel" style={{ position: "relative" }}>
        <div className="q-panel__corner">
          <MuteToggle />
        </div>

        <span className="q-hero-avatar" aria-hidden="true">
          {nextName ? initialOf(nextName) : slot}
        </span>

        <span className="q-panel__eyebrow">
          {previousName
            ? `انتهت جولة ${previousName}`
            : "انتهت الجولة الأولى"}
        </span>

        <h1 className="q-panel__title">
          الدور الآن على{" "}
          <span className="q-panel__title--accent">
            {nextName || slotLabel(slot)}
          </span>
        </h1>

        <p className="q-panel__text">
          أسئلتك مختلفة عن أسئلة زميلتك ومتكافئة معها تمامًا. خذي نفسًا عميقًا،
          وابدئي عندما تكونين جاهزة — الوقت يبدأ مع أول سؤال.
        </p>

        <div className="q-panel__actions">
          <button
            type="button"
            className="q-btn q-btn--primary q-btn--xl"
            onClick={handleStart}
            autoFocus
          >
            ابدئي جولتك
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerHandoff;
