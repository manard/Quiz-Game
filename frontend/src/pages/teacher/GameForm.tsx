import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  createQuiz,
  getGrades,
  getLessons,
  getSubjects,
} from "../../services/api";

type Subject = {
  id: number;
  name: string;
};

type Grade = {
  id: number;
  name: string;
  grade_number: number;
};

type Lesson = {
  id: number;
  subject_id: number;
  grade_id: number;
  name: string;
};

function GameForm() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [subjectId, setSubjectId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [lessonId, setLessonId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionsPerPlayer, setQuestionsPerPlayer] = useState(3);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [subjectsData, gradesData, lessonsData] = await Promise.all([
          getSubjects(),
          getGrades(),
          getLessons(),
        ]);

        setSubjects(subjectsData);
        setGrades(gradesData);
        setLessons(lessonsData);
      } catch {
        setError("فشل تحميل بيانات النموذج");
      }
    }

    loadData();
  }, []);

  const filteredLessons = lessons.filter(
    (lesson) =>
      lesson.subject_id === Number(subjectId) &&
      lesson.grade_id === Number(gradeId)
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (
      !lessonId ||
      !title.trim() ||
      !description.trim() ||
      questionsPerPlayer <= 0
    ) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    try {
      await createQuiz({
        lesson_id: Number(lessonId),
        title,
        description,
        questions_per_player: questionsPerPlayer,
      });

      navigate("/teacher");
    } catch {
      setError("حدث خطأ أثناء إنشاء اللعبة");
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          إنشاء لعبة جديدة
        </h1>

        <p className="text-slate-500 mb-8">
          أدخلي معلومات اللعبة الأساسية
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-bold mb-2">المادة</label>

            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setLessonId("");
              }}
              className="w-full border border-slate-300 rounded-xl p-3"
            >
              <option value="">اختاري المادة</option>

              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2">الصف</label>

            <select
              value={gradeId}
              onChange={(e) => {
                setGradeId(e.target.value);
                setLessonId("");
              }}
              className="w-full border border-slate-300 rounded-xl p-3"
            >
              <option value="">اختاري الصف</option>

              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2">الدرس</label>

            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              disabled={!subjectId || !gradeId}
              className="w-full border border-slate-300 rounded-xl p-3 disabled:bg-slate-100"
            >
              <option value="">اختاري الدرس</option>

              {filteredLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2">عنوان اللعبة</label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3"
              placeholder="مثال: تحدي أساسيات الحاسوب"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">وصف قصير</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 min-h-28"
              placeholder="وصف يظهر في شاشة بداية اللعبة"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">
              عدد الأسئلة لكل متسابقة
            </label>

            <input
              type="number"
              min="1"
              value={questionsPerPlayer}
              onChange={(e) =>
                setQuestionsPerPlayer(Number(e.target.value))
              }
              className="w-full border border-slate-300 rounded-xl p-3"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="bg-violet-600 text-white px-7 py-3 rounded-xl font-bold"
            >
              حفظ اللعبة
            </button>

            <button
              type="button"
              onClick={() => navigate("/teacher")}
              className="bg-slate-200 text-slate-700 px-7 py-3 rounded-xl font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GameForm;