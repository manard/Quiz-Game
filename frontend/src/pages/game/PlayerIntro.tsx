import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { startGameSession } from "../../services/api";

function PlayerIntro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams();

  const { player1, player2 } = location.state || {};

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function createSession() {
      if (!quizId || !player1 || !player2) {
        setError("بيانات اللعبة غير مكتملة");
        setLoading(false);
        return;
      }

      try {
        const session = await startGameSession({
          quiz_id: Number(quizId),
          player_1_name: player1,
          player_2_name: player2,
        });

        setLoading(false);

        setTimeout(() => {
          navigate(`/game/session/${session.id}/player/1`, {
            state: {
              playerName: player1,
              quizId,
              // Carried through so the handoff screen can name the next
              // contestant without an extra request.
              player1,
              player2,
            },
          });
        }, 1200);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "تعذر بدء جلسة اللعبة"
        );
        setLoading(false);
      }
    }

    createSession();
  }, []);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-violet-100 flex items-center justify-center p-6"
    >
      <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-xl w-full">
        {loading ? (
          <>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">
              جاري تجهيز الجولة الأولى...
            </h1>

            <p className="text-slate-500">
              استعدي يا {player1}
            </p>
          </>
        ) : error ? (
          <div className="text-red-600 font-bold">
            {error}
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-slate-800">
            الجولة جاهزة
          </h1>
        )}
      </div>
    </div>
  );
}

export default PlayerIntro;