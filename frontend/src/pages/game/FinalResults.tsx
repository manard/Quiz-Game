import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFinalResults } from "../../services/api";

function FinalResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResults() {
      if (!sessionId) return;

      try {
        const data = await getFinalResults(Number(sessionId));
        setResults(data);
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-100">
        <p className="text-red-600 font-black text-xl">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-violet-100">
        <div className="text-center">
          <div className="text-7xl animate-bounce mb-4">🏆</div>
          <p className="font-black text-2xl text-violet-700">
            جاري حساب النتيجة...
          </p>
        </div>
      </div>
    );
  }

  const isTie = results.result === "tie";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-indigo-700 via-violet-600 to-fuchsia-500 flex items-center justify-center p-6"
    >
      <div className="max-w-4xl w-full bg-white rounded-[36px] shadow-2xl p-8 md:p-12 text-center">
        <div className="text-7xl mb-4">
          {isTie ? "🤝" : "🏆"}
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-3">
          {isTie
            ? "تعادل! كلكم أبطال 🎉"
            : `الفائزة هي ${results.winner?.display_name}!`}
        </h1>

        <p className="text-slate-500 text-lg mb-10">
          انتهى التحدي... وهذه النتيجة النهائية
        </p>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {results.players.map((player: any) => (
            <div
              key={player.player_slot}
              className="bg-slate-100 rounded-3xl p-7"
            >
              <div className="text-4xl mb-3">
                {player.player_slot === 1 ? "🚀" : "⚡"}
              </div>

              <h2 className="text-2xl font-black text-slate-800">
                {player.display_name}
              </h2>

              <p className="text-5xl font-black text-violet-600 mt-5">
                {player.correct_answers}
                <span className="text-xl text-slate-400">
                  {" "}
                  / {results.total_questions}
                </span>
              </p>

              <p className="text-slate-500 mt-2">
                إجابات صحيحة
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/teacher")}
          className="bg-slate-900 text-white px-9 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform"
        >
          العودة إلى لوحة المعلم
        </button>
      </div>
    </div>
  );
}

export default FinalResults;