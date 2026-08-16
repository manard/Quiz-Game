import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  finishPlayerTurn,
  getPlayerQuestions,
  submitAnswer,
  submitTimeout,
} from "../../services/api";

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
}, [sessionId, playerSlot]);

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

  if (error) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-rose-50 flex items-center justify-center p-6"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">😵</div>

          <p className="text-red-600 font-bold text-xl">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-violet-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎯</div>

          <p className="font-bold text-2xl text-violet-700">
            جاري تجهيز السؤال...
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = data.questions[currentIndex];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 p-5 md:p-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between text-white mb-5">
          <div>
            <p className="text-white/70 text-sm">
              المتسابقة الحالية
            </p>

            <h2 className="text-2xl md:text-3xl font-black">
              🚀 {data.display_name}
            </h2>
          </div>

          <div className="bg-white/20 backdrop-blur px-5 py-3 rounded-2xl font-black">
            سؤال {currentIndex + 1} / {data.questions.length}
          </div>
        </div>

        <div className="w-full h-3 bg-white/20 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{
              width: `${
                ((currentIndex + 1) / data.questions.length) * 100
              }%`,
            }}
          />
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl p-6 md:p-10">
          <div className="flex items-center justify-between gap-4 mb-8">
            <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-black">
              🧠 ركّزي منيح!
            </span>

            <span className="bg-violet-100 text-violet-700 px-4 py-2 rounded-full font-black">
              ⏱️ {timeRemaining ?? "..."} ثانية
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-slate-800 text-center leading-relaxed mb-10">
            {currentQuestion.question.question_text}
          </h1>

          <div className="grid md:grid-cols-2 gap-4">
            {currentQuestion.question.options.map(
              (option: any, index: number) => {
                const isSelected =
                  selectedOptionId === option.id;

                let className =
                  "relative border-2 rounded-2xl p-5 text-right text-lg md:text-xl font-bold transition-all duration-200 ";

                if (!feedback) {
                  className += isSelected
                    ? "border-violet-600 bg-violet-100 scale-[1.02]"
                    : "border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50 hover:-translate-y-1";
                } else if (
                  feedback.correct_option?.id === option.id
                ) {
                  className +=
                    "border-emerald-500 bg-emerald-100 text-emerald-900";
                } else if (
                  isSelected &&
                  feedback.is_correct === false
                ) {
                  className +=
                    "border-red-500 bg-red-100 text-red-900";
                } else {
                  className +=
                    "border-slate-200 bg-slate-100 text-slate-400";
                }

                const labels = ["A", "B", "C", "D"];

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    disabled={submitting || !!feedback}
                    className={className}
                  >
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white ml-3">
                      {labels[index]}
                    </span>

                    {option.option_text}

                    {feedback &&
                      feedback.correct_option?.id ===
                        option.id && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
                          ✅
                        </span>
                      )}

                    {feedback &&
                      isSelected &&
                      !feedback.is_correct && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
                          ❌
                        </span>
                      )}
                  </button>
                );
              }
            )}
          </div>

          {feedback && (
            <>
              <div
                className={`mt-8 rounded-3xl p-6 text-center ${
                  feedback.is_correct
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-orange-100 text-orange-900"
                }`}
              >
                <div className="text-5xl mb-3">
                  {feedback.is_correct ? "🎉" : "😅"}
                </div>

                <h2 className="text-2xl font-black mb-3">
                  {feedback.is_correct
                    ? "إجابة صحيحة! شطووورة!"
                    : feedback.timed_out
                    ? "خلص الوقت! ⏰"
                    : "مش مشكلة... الجواب الصح فوق 👆"}
                </h2>

                <p className="text-lg font-semibold">
                  {feedback.explanation}
                </p>
              </div>

              <div className="mt-6 text-center">
                <button
                 onClick={async () => {
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
      navigate(`/game/session/${sessionId}/player/2`);
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
}}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black py-3 px-8 rounded-2xl transition-all"
                >
                  {currentIndex < data.questions.length - 1
                    ? "السؤال التالي ➡️"
                    : "انتهيت من الأسئلة ✨"}
                </button>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionScreen;