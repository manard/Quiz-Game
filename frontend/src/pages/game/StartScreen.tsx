import { useNavigate, useParams } from "react-router-dom";

function StartScreen() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-violet-100 flex items-center justify-center p-6"
    >
      <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-xl w-full">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          تحدي المسابقة التعليمية
        </h1>

        <p className="text-slate-500 mb-8">
          جاهزين نبدأ التحدي؟
        </p>

        <button
          onClick={() => navigate(`/game/${quizId}/players`)}
          className="bg-violet-600 text-white px-8 py-3 rounded-2xl font-bold text-lg"
        >
          ابدأ التحدي
        </button>
      </div>
    </div>
  );
}

export default StartScreen;