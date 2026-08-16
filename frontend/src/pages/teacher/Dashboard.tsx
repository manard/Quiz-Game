import { useEffect, useState } from "react";
import { getQuizzes } from "../../services/api";
import { useNavigate } from "react-router-dom";

type Quiz = {
  id: number;
  title: string;
  description: string;
  questions_per_player: number;
  status: string;
  lesson: {
    name: string;
    subject: {
      name: string;
    };
    grade: {
      name: string;
    };
  };
};

function Dashboard() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const data = await getQuizzes();
        setQuizzes(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadQuizzes();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              لوحة المعلم
            </h1>

            <p className="text-slate-500 mt-2">
              إدارة الألعاب التعليمية
            </p>
          </div>

          <button
                onClick={() => navigate("/teacher/new")}
                className="bg-violet-600 text-white px-6 py-3 rounded-xl font-bold"
                >
                + إنشاء لعبة جديدة
                </button>
        </div>

        {loading ? (
          <p>جاري تحميل الألعاب...</p>
        ) : (
          <div className="grid gap-5">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {quiz.title}
                    </h2>

                    <p className="text-slate-500 mt-2">
                      {quiz.lesson.subject.name} • {quiz.lesson.grade.name} •{" "}
                      {quiz.lesson.name}
                    </p>

                    <p className="text-sm text-slate-400 mt-2">
                      {quiz.questions_per_player} أسئلة لكل متسابقة
                    </p>
                  </div>

                  <span className="h-fit bg-slate-100 px-4 py-2 rounded-full text-sm font-bold">
                    {quiz.status}
                  </span>
                  <div className="flex gap-3 mt-5">
 <button
  onClick={() => navigate(`/game/${quiz.id}`)}
  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold"
>
  تشغيل
</button>

  <button
  onClick={() =>
    navigate(`/teacher/quiz/${quiz.id}/questions`)
  }
  className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold"
>
  تعديل
</button>

  <button className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
    حذف
  </button>
</div>
                </div>
              </div>
            ))}
            
          </div>
        )}
        
      </div>    
    </div>
  );
  
}


export default Dashboard;