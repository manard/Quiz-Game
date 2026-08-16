import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFinalResults } from "../../services/api";
import { playCue, primeAudio } from "../../lib/sound";
import { initialOf } from "../../lib/contestant";
import Confetti from "../../components/game/Confetti";
import MuteToggle from "../../components/game/MuteToggle";
import ScoreCounter from "../../components/game/ScoreCounter";

type ResultPlayer = {
  player_slot: number;
  display_name: string;
  correct_answers: number;
};

type FinalResultsData = {
  session_id: number;
  total_questions: number;
  players: ResultPlayer[];
  result: "winner" | "tie";
  winner: { player_slot: number; display_name: string } | null;
};

/**
 * The reveal runs as a small timed state machine so the winner lands with some
 * build-up instead of appearing the instant the request resolves.
 *
 *   intro → countdown (3·2·1) → scores → drumroll → reveal
 *
 * The teacher can jump straight to `reveal` with the skip button.
 */
type Phase = "loading" | "intro" | "countdown" | "scores" | "drumroll" | "reveal";

const INTRO_MS = 1500;
const BEAT_MS = 900;
const SCORES_MS = 2700;
const DRUMROLL_MS = 2300;
/** Second scoreboard card lands this long after the first. */
const CARD_STAGGER_MS = 1000;

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 5h3a3 3 0 0 1-3 3M7 5H4a3 3 0 0 0 3 3" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 8l4.2 3.2L12 4.5l4.8 6.7L21 8l-1.6 10.5H4.6L3 8z" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 12l3 3 2-2 3 3" />
      <path d="M2 10l4-4 4 2h4l4-2 4 4-4 6-3-2M6 16l-4-6" />
    </svg>
  );
}

function FinalResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState<FinalResultsData | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [beat, setBeat] = useState(3);

  useEffect(() => {
    async function loadResults() {
      if (!sessionId) return;

      try {
        const data = await getFinalResults(Number(sessionId));

        setResults(data);
        setPhase("intro"); // results are in — start the show
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "تعذر تحميل النتائج"
        );
      }
    }

    loadResults();
  }, [sessionId]);

  useEffect(() => {
    primeAudio();
  }, []);

  useEffect(() => {
    if (phase !== "intro") return;

    const timer = setTimeout(() => setPhase("countdown"), INTRO_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return;

    playCue("tick");

    const timer = setTimeout(() => {
      if (beat <= 1) {
        setPhase("scores");
      } else {
        setBeat((current) => current - 1);
      }
    }, BEAT_MS);

    return () => clearTimeout(timer);
  }, [phase, beat]);

  useEffect(() => {
    if (phase !== "scores") return;

    playCue("score");

    const second = setTimeout(() => playCue("score"), CARD_STAGGER_MS);
    const next = setTimeout(() => setPhase("drumroll"), SCORES_MS);

    return () => {
      clearTimeout(second);
      clearTimeout(next);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "drumroll") return;

    playCue("drumroll");

    const timer = setTimeout(() => setPhase("reveal"), DRUMROLL_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "reveal" || !results) return;

    playCue(results.result === "tie" ? "tie" : "fanfare");
  }, [phase, results]);

  if (error) {
    return (
      <div dir="rtl" className="q-scope q-stage q-stage--center">
        <div className="q-panel q-panel--error" role="alert">
          <span className="q-panel__eyebrow">حدث خطأ</span>
          <h1 className="q-panel__title">{error}</h1>

          <div className="q-panel__actions">
            <button
              type="button"
              className="q-btn q-btn--ghost"
              onClick={() => navigate("/teacher")}
            >
              العودة إلى لوحة المعلم
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div dir="rtl" className="q-scope q-stage q-stage--center">
        <div className="q-panel">
          <div className="q-loader" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <span className="q-panel__eyebrow">لحظة من فضلك</span>
          <h1 className="q-panel__title">جاري احتساب النتائج</h1>
        </div>
      </div>
    );
  }

  const isTie = results.result === "tie";
  const showBoard = phase === "scores" || phase === "drumroll" || phase === "reveal";
  const revealed = phase === "reveal";

  return (
    <div
      dir="rtl"
      className="q-scope q-stage q-stage--center q-results"
      data-phase={phase}
    >
      <Confetti active={revealed && !isTie} />

      <div className="q-results__tools">
        <MuteToggle />

        {!revealed && (
          <button
            type="button"
            className="q-btn q-btn--ghost q-btn--sm"
            onClick={() => setPhase("reveal")}
          >
            تخطي
          </button>
        )}
      </div>

      {phase === "intro" && (
        <div className="q-curtain">
          <span className="q-panel__eyebrow">انتهى التحدي</span>
          <h1 className="q-mega">النتيجة النهائية</h1>
          <p className="q-curtain__sub">استعدوا... اللحظة الحاسمة اقتربت</p>
        </div>
      )}

      {phase === "countdown" && (
        <div className="q-countdown" key={beat}>
          <span className="q-countdown__ring" aria-hidden="true" />
          <span className="q-countdown__num">{beat}</span>
        </div>
      )}

      {showBoard && (
        <div className="q-arena">
          <div className="q-arena__cards">
            {results.players.map((player, index) => {
              const isWinner =
                revealed &&
                !isTie &&
                results.winner?.player_slot === player.player_slot;

              const isRunnerUp =
                revealed &&
                !isTie &&
                results.winner?.player_slot !== player.player_slot;

              let role = "neutral";
              if (isWinner) role = "winner";
              else if (isRunnerUp) role = "runner-up";
              else if (revealed && isTie) role = "tie";

              return (
                <article
                  key={player.player_slot}
                  className={`q-score-card q-score-card--slot-${player.player_slot}`}
                  data-role={role}
                  style={{ animationDelay: `${index * (CARD_STAGGER_MS / 1000)}s` }}
                >
                  {isWinner && (
                    <span className="q-score-card__crown" aria-hidden="true">
                      <CrownIcon />
                    </span>
                  )}

                  <span className="q-score-card__avatar" aria-hidden="true">
                    {initialOf(player.display_name)}
                  </span>

                  <h2 className="q-score-card__name">{player.display_name}</h2>

                  <p className="q-score-card__value">
                    <ScoreCounter
                      target={player.correct_answers}
                      active={showBoard}
                      delayMs={index * CARD_STAGGER_MS}
                    />
                    <span className="q-score-card__total">
                      / {results.total_questions}
                    </span>
                  </p>

                  <span className="q-label">إجابات صحيحة</span>
                </article>
              );
            })}

            <span className="q-vs" aria-hidden="true">
              VS
            </span>
          </div>

          <div className="q-announce" data-phase={phase}>
            {phase === "scores" && (
              <p className="q-announce__label">تم احتساب كل الإجابات</p>
            )}

            {phase === "drumroll" && (
              <p className="q-announce__label q-announce__label--tense">
                والفائزة هي<span className="q-dots">...</span>
              </p>
            )}

            {revealed && (
              <div className="q-announce__result">
                <span className="q-announce__icon">
                  {isTie ? <HandshakeIcon /> : <TrophyIcon />}
                </span>

                {isTie ? (
                  <>
                    <h1 className="q-announce__name">تعادل!</h1>
                    <p className="q-announce__sub">
                      أداء متكافئ تمامًا — كلتاكما بطلة
                    </p>
                  </>
                ) : (
                  <>
                    <span className="q-panel__eyebrow">الفائزة</span>
                    <h1 className="q-announce__name">
                      {results.winner?.display_name}
                    </h1>
                    <p className="q-announce__sub">
                      مبروك! أداء يستحق التصفيق 👏
                    </p>
                  </>
                )}

                <div className="q-panel__actions">
                  <button
                    type="button"
                    className="q-btn q-btn--primary q-btn--xl"
                    onClick={() => navigate("/teacher")}
                  >
                    العودة إلى لوحة المعلم
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinalResults;
