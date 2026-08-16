import { prisma } from "../prismaClient";
export async function getQuestionPairs(req, res) {
    try {
        const quizId = Number(req.params.quizId);
        const questionPairs = await prisma.questionPair.findMany({
            where: {
                quiz_id: quizId,
            },
            include: {
                questions: {
                    include: {
                        options: true,
                    },
                },
            },
            orderBy: {
                question_order: "asc",
            },
        });
        res.json(questionPairs);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch question pairs",
        });
    }
}
export async function createQuestionPair(req, res) {
    try {
        const { quiz_id, question_order, difficulty, timer_seconds, learning_objective, } = req.body;
        if (!quiz_id ||
            !question_order ||
            !timer_seconds ||
            Number(timer_seconds) <= 0) {
            return res.status(400).json({
                message: "Quiz, question order and valid timer are required",
            });
        }
        const questionPair = await prisma.questionPair.create({
            data: {
                quiz_id: Number(quiz_id),
                question_order: Number(question_order),
                difficulty: difficulty || null,
                timer_seconds: Number(timer_seconds),
                learning_objective: learning_objective || null,
            },
        });
        res.status(201).json(questionPair);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to create question pair",
        });
    }
}
