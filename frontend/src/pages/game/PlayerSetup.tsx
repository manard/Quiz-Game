import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function PlayerSetup() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");

  function handleContinue() {
    if (!player1.trim() || !player2.trim()) {
      return;
    }

    navigate(`/game/${quizId}/instructions`, {
      state: {
        player1,
        player2,
      },
    });
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 flex items-center justify-center p-6"
    >
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-xl w-full">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">
          أسماء المتسابقتين
        </h1>

        <div className="space-y-5">
          <div>
            <label className="block font-bold mb-2">
              اسم المتسابقة الأولى
            </label>

            <input
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3"
              placeholder="مثال: منار"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">
              اسم المتسابقة الثانية
            </label>

            <input
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3"
              placeholder="مثال: سارة"
            />
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold"
          >
            متابعة
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerSetup;