import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  finishPlayerTurn,
  getPlayerQuestions,
  submitAnswer,
  submitTimeout,
} from "../../services/api";
import { playCue, primeAudio } from "../../lib/sound";
import ContestantBadge from "../../components/game/ContestantBadge";
import MuteToggle from "../../components/game/MuteToggle";
import ProgressTrack from "../../components/game/ProgressTrack";
import type { QuestionMark } from "../../components/game/ProgressTrack";
import TimerRing from "../../components/game/TimerRing";

const OPTION_KEYS = ["أ", "ب", "ج", "د"];

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

/** Seconds left at which the low-time warning starts pipping. */
const WARNING_THRESHOLD = 5;

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function QuestionScreen() {
  const { sessionId, playerSlot } = useParams();

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const navigate = useNavigate();

  // --- presentation-only state ------------------------------------------
  const location = useLocation();
  const nextPlayerName =
    (location.state as { player2?: string } | null)?.player2 ?? "";

  /** Mirrors the feedback already shown on screen, for the progress track. */
  const [marks, setMarks] = useState<QuestionMark[]>([]);

  // Sound guards: each ref makes sure a cue fires at most once per event.
  const questionCuedRef = useRef<number | null>(null);
  const feedbackCuedRef = useRef<unknown>(null);
  const warnedAtRef = useRef<number | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      if (!sessionId || !playerSlot) return;

      try {
        const result = await getPlayerQuestions(
          Number(sessionId),
          Number(playerSlot)
        );

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "تعذر تحميل الأسئلة"
        );
      }
    }

    loadQuestions();
  }, [sessionId, playerSlot]);

  useEffect(() => {
    if (!data) return;

    const currentQuestion = data.questions[currentIndex];

    setTimeRemaining(currentQuestion.timer_seconds);
  }, [data, currentIndex]);

 useEffect(() => {
  if (
    !data ||
    feedback ||
    timeRemaining === null ||
    timeRemaining <= 0
  ) {
    return;
  }

  const timer = setTimeout(() => {
    setTimeRemaining((current) =>
      current === null ? null : current - 1
    );
  }, 1000);

  return () => clearTimeout(timer);
}, [data, feedback, timeRemaining]);
  useEffect(() => {
    async function handleTimeout() {
      if (
        !data ||
        !sessionId ||
        !playerSlot ||
        feedback ||
        timeRemaining !== 0
      ) {
        return;
      }

      const currentQuestion = data.questions[currentIndex];

      try {
        const result = await submitTimeout(
          Number(sessionId),
          Number(playerSlot),
          currentQuestion.question.id
        );

        setFeedback(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ عند انتهاء الوقت"
        );
      }
    }

    handleTimeout();
  }, [
    timeRemaining,
    data,
    currentIndex,
    feedback,
    sessionId,
    playerSlot,
  ]);
  useEffect(() => {
  setData(null);
  setError("");
  setCurrentIndex(0);
  setSelectedOptionId(null);
  setFeedback(null);
  setSubmitting(false);
  setTimeRemaining(null);

  // presentation-only resets
  setMarks([]);
  questionCuedRef.current = null;
  feedbackCuedRef.current = null;
  warnedAtRef.current = null;
}, [sessionId, playerSlot]);

  // Unlock the audio context — this screen is only reachable after a tap.
  useEffect(() => {
    primeAudio();
  }, []);

  // Cue: a new question is on screen.
  useEffect(() => {
    if (!data) return;
    if (questionCuedRef.current === currentIndex) return;

    questionCuedRef.current = currentIndex;
    warnedAtRef.current = null;
    playCue("question");
  }, [data, currentIndex]);

  // Cue: the clock is running out (one pip per remaining second).
  useEffect(() => {
    if (feedback || timeRemaining === null) return;
    if (timeRemaining <= 0 || timeRemaining > WARNING_THRESHOLD) return;
    if (warnedAtRef.current === timeRemaining) return;

    warnedAtRef.current = timeRemaining;
    playCue("warning");
  }, [timeRemaining, feedback]);

  // Cue: the result landed. Also records the outcome for the progress track.
  useEffect(() => {
    if (!feedback) return;
    if (feedbackCuedRef.current === feedback) return;

    feedbackCuedRef.current = feedback;

    playCue(
      feedback.timed_out
        ? "timeout"
        : feedback.is_correct
        ? "correct"
        : "wrong"
    );

    setMarks((current) => {
      const next = [...current];
      next[currentIndex] = feedback.is_correct ? "correct" : "wrong";
      return next;
    });
  }, [feedback, currentIndex]);

  async function handleAnswer(optionId: number) {
    if (
      !data ||
      !sessionId ||
      !playerSlot ||
      submitting ||
      feedback
    ) {
      return;
    }

    playCue("select");

    const currentQuestion = data.questions[currentIndex];

    setSubmitting(true);
    setSelectedOptionId(optionId);

    try {
      const result = await submitAnswer(
        Number(sessionId),
        Number(playerSlot),
        {
          questionId: currentQuestion.question.id,
          selectedOptionId: optionId,
        }
      );

      setFeedback(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء إرسال الإجابة"
      );

      setSelectedOptionId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (currentIndex < data.questions.length - 1) {
      setCurrentIndex((current) => current + 1);
      setSelectedOptionId(null);
      setFeedback(null);
      return;
    }

    try {
      await finishPlayerTurn(
        Number(sessionId),
        Number(playerSlot)
      );

      if (Number(playerSlot) === 1) {
        // Hand over to a dedicated screen — the second contestant starts
        // only when she explicitly presses the start button there.
        navigate(`/game/session/${sessionId}/handoff/2`, {
          state: {
            previousPlayerName: data.display_name,
            nextPlayerName,
          },
        });
      } else {
        navigate(`/game/session/${sessionId}/results`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر إنهاء الجولة"
      );
    }
  }

  if (error) {
    return (
      <div dir="rtl" className="q-scope q-stage q-stage--center">
        <div className="q-panel q-panel--error" role="alert">
          <span className="q-panel__eyebrow">حدث خطأ</span>
          <h1 className="q-panel__title">{error}</h1>
          <p className="q-panel__text">
            حاولي تحديث الصفحة أو العودة إلى المعلّم للمتابعة.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div dir="rtl" className="q-scope q-stage q-stage--center">
        <div className="q-panel">
          <div className="q-loader" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <span className="q-panel__eyebrow">استعدي</span>
          <h1 className="q-panel__title">جاري تجهيز السؤال</h1>
        </div>
      </div>
    );
  }

  const currentQuestion = data.questions[currentIndex];
  const totalQuestions = data.questions.length;
  const slot = Number(playerSlot);

  const feedbackState = feedback
    ? feedback.timed_out
      ? "timeout"
      : feedback.is_correct
      ? "correct"
      : "wrong"
    : undefined;

  const difficultyLabel = currentQuestion.difficulty
    ? DIFFICULTY_LABELS[currentQuestion.difficulty] ?? currentQuestion.difficulty
    : null;

  const isLastQuestion = currentIndex >= totalQuestions - 1;

  return (
    <div
      dir="rtl"
      className="q-scope q-stage"
      data-feedback={feedback ? "true" : "false"}
    >
      <header className="q-hud">
        <ContestantBadge name={data.display_name} slot={slot} />

        <div className="q-hud__center">
          <p className="q-counter">
            السؤال <b>{currentIndex + 1}</b> من {totalQuestions}
          </p>

          <ProgressTrack
            total={totalQuestions}
            currentIndex={currentIndex}
            marks={marks}
          />
        </div>

        <div className="q-hud__side">
          <MuteToggle />

          <TimerRing
            seconds={timeRemaining}
            total={currentQuestion.timer_seconds}
          />
        </div>
      </header>

      <main className="q-main">
        {/* Keyed on the question id so every question replays the entry motion. */}
        <section className="q-card" key={currentQuestion.question.id}>
          <div className="q-card__top">
            <span className="q-chip q-chip--accent">
              مجموعة {data.player_set}
            </span>

            {difficultyLabel && (
              <span className="q-chip">{difficultyLabel}</span>
            )}
          </div>

          {currentQuestion.question.image_url && (
            <img
              className="q-card__media"
              src={currentQuestion.question.image_url}
              alt=""
            />
          )}

          <h1 className="q-question">
            {currentQuestion.question.question_text}
          </h1>

          <div className="q-options">
            {currentQuestion.question.options.map(
              (option: any, index: number) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrectOption =
                  feedback?.correct_option?.id === option.id;

                let state: string;

                if (!feedback) {
                  state = isSelected ? "picked" : "idle";
                } else if (isCorrectOption) {
                  state = "correct";
                } else if (isSelected) {
                  state = "incorrect";
                } else {
                  state = "dimmed";
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    className="q-option"
                    data-state={state}
                    style={{ "--q-i": index } as CSSProperties}
                    onClick={() => handleAnswer(option.id)}
                    disabled={submitting || !!feedback}
                  >
                    <span className="q-option__key" aria-hidden="true">
                      {OPTION_KEYS[index] ?? index + 1}
                    </span>

                    <span className="q-option__text">
                      {option.option_text}
                    </span>

                    {state === "correct" && (
                      <span className="q-option__mark">
                        <CheckIcon />
                      </span>
                    )}

                    {state === "incorrect" && (
                      <span className="q-option__mark">
                        <CrossIcon />
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </section>
      </main>

      {feedback && (
        <footer className="q-sheet" data-state={feedbackState} role="status">
          <div className="q-sheet__inner">
            <span className="q-sheet__icon">
              {feedbackState === "correct" ? (
                <CheckIcon />
              ) : feedbackState === "timeout" ? (
                <ClockIcon />
              ) : (
                <CrossIcon />
              )}
            </span>

            <div className="q-sheet__body">
              <p className="q-sheet__title">
                {feedback.is_correct
                  ? "إجابة صحيحة"
                  : feedback.timed_out
                  ? "انتهى الوقت"
                  : "إجابة غير صحيحة"}
              </p>

              <p className="q-sheet__text">{feedback.explanation}</p>
            </div>

            <button
              type="button"
              className="q-btn q-btn--primary"
              onClick={handleNext}
              autoFocus
            >
              {isLastQuestion ? "إنهاء الجولة" : "السؤال التالي"}
              <ArrowIcon />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default QuestionScreen;
