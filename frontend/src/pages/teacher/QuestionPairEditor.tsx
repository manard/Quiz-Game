import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createQuestion,
  createQuestionPair,
  getQuestionPairs,
  getQuizById,
  publishQuiz,
} from "../../services/api";


function QuestionPairEditor() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  const [questionOrder, setQuestionOrder] = useState(1);
  const [difficulty, setDifficulty] = useState("easy");
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [learningObjective, setLearningObjective] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [createdPairId, setCreatedPairId] = useState<number | null>(null);

  const [questionAText, setQuestionAText] = useState("");
  const [questionAExplanation, setQuestionAExplanation] = useState("");
  const [savedPairs, setSavedPairs] = useState<any[]>([]);

  const [questionAOptions, setQuestionAOptions] = useState([
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ]);
  const [questionBText, setQuestionBText] = useState("");
  const [questionBExplanation, setQuestionBExplanation] = useState("");
  const [quiz, setQuiz] = useState<any>(null);

const [questionBOptions, setQuestionBOptions] = useState([
  { option_text: "", is_correct: true },
  { option_text: "", is_correct: false },
  { option_text: "", is_correct: false },
  { option_text: "", is_correct: false },
]);
useEffect(() => {
  async function loadPairs() {
    if (!quizId) return;

    try {
      const data = await getQuestionPairs(Number(quizId));
      const quizData = await getQuizById(Number(quizId));

setSavedPairs(data);
setQuiz(quizData);
      setSavedPairs(data);

      if (data.length > 0) {
        setQuestionOrder(data.length + 1);
      }
    } catch {
      setError("فشل تحميل أزواج الأسئلة");
    }
  }

  loadPairs();
}, [quizId]);

  async function handleCreatePair() {
    setMessage("");
    setError("");

    if (!quizId) {
      setError("Quiz ID غير موجود");
      return;
    }

    if (timerSeconds <= 0 || questionOrder <= 0) {
      setError("الترتيب والوقت يجب أن يكونا أكبر من صفر");
      return;
    }

    try {
      const pair = await createQuestionPair({
        quiz_id: Number(quizId),
        question_order: questionOrder,
        difficulty,
        timer_seconds: timerSeconds,
        learning_objective: learningObjective,
      });
      if (quiz && savedPairs.length >= quiz.questions_per_player) {
        setError(
            `هذه اللعبة تحتاج ${quiz.questions_per_player} أزواج أسئلة فقط`
        );
        return;
        }

      setCreatedPairId(pair.id);
      setSavedPairs((current) => [...current, pair]);
      setQuestionOrder(pair.question_order + 1);

      setMessage(
        `تم إنشاء زوج الأسئلة بنجاح - Pair ID: ${pair.id}`
      );
    } catch {
      setError("حدث خطأ أثناء إنشاء زوج الأسئلة");
    }
  }
  async function handleCreateQuestionB() {
  setMessage("");
  setError("");

  if (!createdPairId) {
    setError("يجب إنشاء زوج الأسئلة أولاً");
    return;
  }

  if (!questionBText.trim() || !questionBExplanation.trim()) {
    setError("يرجى كتابة السؤال وشرح الإجابة");
    return;
  }

  const hasEmptyOption = questionBOptions.some(
    (option) => !option.option_text.trim()
  );

  if (hasEmptyOption) {
    setError("يرجى تعبئة الخيارات الأربعة");
    return;
  }

  try {
    await createQuestion({
      question_pair_id: createdPairId,
      player_set: "B",
      question_text: questionBText,
      explanation: questionBExplanation,
      options: questionBOptions,
    });

    setMessage("تم حفظ سؤال B بنجاح");
  } catch {
    setError("حدث خطأ أثناء حفظ سؤال B");
  }
}

  async function handleCreateQuestionA() {
    setMessage("");
    setError("");

    if (!createdPairId) {
      setError("يجب إنشاء زوج الأسئلة أولاً");
      return;
    }

    if (!questionAText.trim() || !questionAExplanation.trim()) {
      setError("يرجى كتابة السؤال وشرح الإجابة");
      return;
    }

    const hasEmptyOption = questionAOptions.some(
      (option) => !option.option_text.trim()
    );

    if (hasEmptyOption) {
      setError("يرجى تعبئة الخيارات الأربعة");
      return;
    }

    try {
      await createQuestion({
        question_pair_id: createdPairId,
        player_set: "A",
        question_text: questionAText,
        explanation: questionAExplanation,
        options: questionAOptions,
      });

      setMessage("تم حفظ سؤال A بنجاح");
    } catch {
      setError("حدث خطأ أثناء حفظ سؤال A");
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          إضافة زوج أسئلة
        </h1>

        <p className="text-slate-500 mb-8">
          Quiz ID: {quizId}
        </p>
        {savedPairs.length > 0 && (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-slate-800 mb-4">
      أزواج الأسئلة المحفوظة
    </h2>

    <div className="space-y-3">
      {savedPairs.map((pair) => (
        <div
          key={pair.id}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4"
        >
          <div className="font-bold">
            السؤال رقم {pair.question_order}
          </div>

          <div className="text-sm text-slate-500 mt-1">
            Pair ID: {pair.id} • الوقت: {pair.timer_seconds} ثانية
          </div>

          <div className="text-sm text-slate-500 mt-1">
           عدد الأسئلة المحفوظة داخل الزوج: {pair.questions?.length ?? 0}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {message && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block font-bold mb-2">
              ترتيب السؤال
            </label>

            <input
              type="number"
              min="1"
              value={questionOrder}
              onChange={(e) =>
                setQuestionOrder(Number(e.target.value))
              }
              className="w-full border border-slate-300 rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">
              مستوى الصعوبة
            </label>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3"
            >
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2">
              الوقت بالثواني
            </label>

            <input
              type="number"
              min="1"
              value={timerSeconds}
              onChange={(e) =>
                setTimerSeconds(Number(e.target.value))
              }
              className="w-full border border-slate-300 rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">
              الهدف التعليمي
            </label>

            <input
              value={learningObjective}
              onChange={(e) =>
                setLearningObjective(e.target.value)
              }
              className="w-full border border-slate-300 rounded-xl p-3"
              placeholder="مثال: التمييز بين أجهزة الإدخال والإخراج"
            />
          </div>

          <button
            type="button"
            onClick={handleCreatePair}
            className="bg-violet-600 text-white px-7 py-3 rounded-xl font-bold"
          >
            إنشاء الزوج
          </button>
        </div>

        {createdPairId && (
          <div className="border-t border-slate-200 pt-8 mt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              سؤال المتسابقة A
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block font-bold mb-2">
                  نص السؤال
                </label>

                <textarea
                  value={questionAText}
                  onChange={(e) =>
                    setQuestionAText(e.target.value)
                  }
                  className="w-full border border-slate-300 rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">
                  شرح الإجابة
                </label>

                <textarea
                  value={questionAExplanation}
                  onChange={(e) =>
                    setQuestionAExplanation(e.target.value)
                  }
                  className="w-full border border-slate-300 rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block font-bold mb-3">
                  الخيارات الأربعة
                </label>

                <div className="space-y-3">
                  {questionAOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >
                      <input
                        type="radio"
                        name="question-a-correct"
                        checked={option.is_correct}
                        onChange={() => {
                          setQuestionAOptions((current) =>
                            current.map(
                              (item, itemIndex) => ({
                                ...item,
                                is_correct:
                                  itemIndex === index,
                              })
                            )
                          );
                        }}
                      />

                      <input
                        value={option.option_text}
                        onChange={(e) => {
                          const value = e.target.value;

                          setQuestionAOptions((current) =>
                            current.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      option_text: value,
                                    }
                                  : item
                            )
                          );
                        }}
                        placeholder={`الخيار ${index + 1}`}
                        className="flex-1 border border-slate-300 rounded-xl p-3"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateQuestionA}
                className="bg-blue-600 text-white px-7 py-3 rounded-xl font-bold"
              >
                حفظ سؤال A
              </button>
            </div>
          </div>
        )}
        {createdPairId && (
  <div className="border-t border-slate-200 pt-8 mt-8">
    <h2 className="text-2xl font-bold text-slate-800 mb-6">
      سؤال المتسابقة B
    </h2>

    <div className="space-y-5">
      <div>
        <label className="block font-bold mb-2">نص السؤال</label>

        <textarea
          value={questionBText}
          onChange={(e) => setQuestionBText(e.target.value)}
          className="w-full border border-slate-300 rounded-xl p-3"
        />
      </div>

      <div>
        <label className="block font-bold mb-2">شرح الإجابة</label>

        <textarea
          value={questionBExplanation}
          onChange={(e) => setQuestionBExplanation(e.target.value)}
          className="w-full border border-slate-300 rounded-xl p-3"
        />
      </div>

      <div>
        <label className="block font-bold mb-3">
          الخيارات الأربعة
        </label>

        <div className="space-y-3">
          {questionBOptions.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="radio"
                name="question-b-correct"
                checked={option.is_correct}
                onChange={() => {
                  setQuestionBOptions((current) =>
                    current.map((item, itemIndex) => ({
                      ...item,
                      is_correct: itemIndex === index,
                    }))
                  );
                }}
              />

              <input
                value={option.option_text}
                onChange={(e) => {
                  const value = e.target.value;

                  setQuestionBOptions((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, option_text: value }
                        : item
                    )
                  );
                }}
                placeholder={`الخيار ${index + 1}`}
                className="flex-1 border border-slate-300 rounded-xl p-3"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCreateQuestionB}
        className="bg-emerald-600 text-white px-7 py-3 rounded-xl font-bold"
      >
        حفظ سؤال B
      </button>
    </div>
  </div>
)}
{quiz && (
  <button
    type="button"
    onClick={async () => {
      setMessage("");
      setError("");

      try {
        const result = await publishQuiz(Number(quizId));

        setMessage(result.message || "تم نشر اللعبة بنجاح");

        setQuiz((current: any) => ({
          ...current,
          status: "published",
        }));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "تعذر نشر اللعبة"
        );
      }
    }}
    className="bg-emerald-600 text-white px-7 py-3 rounded-xl font-bold mt-8 ml-3"
  >
    نشر اللعبة
  </button>
)}

        <button
          type="button"
          onClick={() => navigate("/teacher")}
          className="bg-slate-200 text-slate-700 px-7 py-3 rounded-xl font-bold mt-8"
        >
          العودة
        </button>
      </div>
    </div>
  );
}

export default QuestionPairEditor;