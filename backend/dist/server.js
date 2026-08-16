import express from "express";
import cors from "cors";
import { prisma } from "./prismaClient";
import subjectsRouter from "./routes/subjects.routes";
import gradesRouter from "./routes/grades.routes";
import lessonsRouter from "./routes/lessons.routes";
import quizzesRouter from "./routes/quizzes.routes";
import questionPairsRouter from "./routes/questionPairs.routes";
import questionsRouter from "./routes/questions.routes";
import gameSessionsRouter from "./routes/gameSessions.routes";
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());
app.use("/api/subjects", subjectsRouter);
app.use("/api/grades", gradesRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/quizzes", quizzesRouter);
app.use("/api/question-pairs", questionPairsRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/game-sessions", gameSessionsRouter);
app.get("/", (req, res) => {
    res.send("Quiz Game Backend is running!");
});
app.get("/db-test", async (req, res) => {
    const subjectCount = await prisma.subject.count();
    res.json({
        message: "Database connection is working!",
        subjects: subjectCount,
    });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
