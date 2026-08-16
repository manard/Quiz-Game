import { useLocation, useNavigate, useParams } from "react-router-dom";

function Instructions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams();

  const { player1, player2 } = location.state || {};

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-violet-100 flex items-center justify-center p-6"
    >
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          تعليمات اللعبة
        </h1>

        <ul className="space-y-3 text-lg text-slate-600 mb-8">
          <li>• كل متسابقة تحصل على مجموعة أسئلة مختلفة ومتكافئة.</li>
          <li>• لكل سؤال وقت محدد.</li>
          <li>• كل إجابة صحيحة = نقطة واحدة.</li>
          <li>• سرعة الإجابة لا تؤثر على النتيجة.</li>
          <li>• بعد المتسابقة الأولى تبدأ المتسابقة الثانية.</li>
        </ul>

        <button
          onClick={() =>
            navigate(`/game/${quizId}/start-session`, {
              state: {
                player1,
                player2,
              },
            })
          }
          className="bg-violet-600 text-white px-8 py-3 rounded-xl font-bold"
        >
          بدء الجولة الأولى
        </button>
      </div>
    </div>
  );
}

export default Instructions;