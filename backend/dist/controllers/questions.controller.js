import { prisma } from "../prismaClient";
export async function createQuestion(req, res) {
    try {
        const { question_pair_id, player_set, question_text, explanation, options, } = req.body;
        if (!question_pair_id ||
            !player_set ||
            !question_text ||
            !explanation ||
            !Array.isArray(options) ||
            options.length !== 4) {
            return res.status(400).json({
                message: "Question data is incomplete or options are not exactly four",
            });
        }
        const correctOptions = options.filter((option) => option.is_correct === true);
        if (correctOptions.length !== 1) {
            return res.status(400).json({
                message: "Exactly one option must be correct",
            });
        }
        const question = await prisma.question.create({
            data: {
                question_pair_id: Number(question_pair_id),
                player_set,
                question_text: question_text.trim(),
                explanation: explanation.trim(),
                options: {
                    create: options.map((option, index) => ({
                        option_order: index + 1,
                        option_text: option.option_text.trim(),
                        is_correct: option.is_correct,
                    })),
                },
            },
            include: {
                options: true,
            },
        });
        res.status(201).json(question);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to create question",
        });
    }
}
