import { prisma } from "../prismaClient";
export async function startGameSession(req, res) {
    try {
        const { quiz_id, player_1_name, player_2_name } = req.body;
        if (!quiz_id ||
            !player_1_name ||
            !player_1_name.trim() ||
            !player_2_name ||
            !player_2_name.trim()) {
            return res.status(400).json({
                message: "Quiz and both contestant names are required",
            });
        }
        const quiz = await prisma.quiz.findUnique({
            where: {
                id: Number(quiz_id),
            },
        });
        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found",
            });
        }
        if (quiz.status !== "published") {
            return res.status(400).json({
                message: "Only published quizzes can be played",
            });
        }
        const gameSession = await prisma.gameSession.create({
            data: {
                quiz_id: Number(quiz_id),
                status: "in_progress",
                current_player_slot: 1,
                current_question_order: 1,
                started_at: new Date(),
                players: {
                    create: [
                        {
                            player_slot: 1,
                            display_name: player_1_name.trim(),
                        },
                        {
                            player_slot: 2,
                            display_name: player_2_name.trim(),
                        },
                    ],
                },
            },
            include: {
                players: true,
            },
        });
        res.status(201).json(gameSession);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to start game session",
        });
    }
}
export async function getPlayerQuestions(req, res) {
    try {
        const sessionId = Number(req.params.sessionId);
        const playerSlot = Number(req.params.playerSlot);
        if (!sessionId || ![1, 2].includes(playerSlot)) {
            return res.status(400).json({
                message: "Invalid session or player slot",
            });
        }
        const gameSession = await prisma.gameSession.findUnique({
            where: {
                id: sessionId,
            },
            include: {
                players: true,
            },
        });
        if (!gameSession) {
            return res.status(404).json({
                message: "Game session not found",
            });
        }
        if (gameSession.status !== "in_progress") {
            return res.status(400).json({
                message: "This game session is not active",
            });
        }
        if (gameSession.current_player_slot !== playerSlot) {
            return res.status(400).json({
                message: "It is not this player's turn",
            });
        }
        const player = gameSession.players.find((item) => item.player_slot === playerSlot);
        if (!player) {
            return res.status(404).json({
                message: "Player not found in this session",
            });
        }
        const playerSet = playerSlot === 1 ? "A" : "B";
        const questionPairs = await prisma.questionPair.findMany({
            where: {
                quiz_id: gameSession.quiz_id,
            },
            orderBy: {
                question_order: "asc",
            },
            include: {
                questions: {
                    where: {
                        player_set: playerSet,
                    },
                    select: {
                        id: true,
                        question_text: true,
                        explanation: true,
                        image_url: true,
                        options: {
                            select: {
                                id: true,
                                option_order: true,
                                option_text: true,
                            },
                            orderBy: {
                                option_order: "asc",
                            },
                        },
                    },
                },
            },
        });
        const questions = questionPairs.map((pair) => ({
            question_order: pair.question_order,
            timer_seconds: pair.timer_seconds,
            difficulty: pair.difficulty,
            question: pair.questions[0],
        }));
        res.json({
            session_id: gameSession.id,
            player_id: player.id,
            player_slot: player.player_slot,
            display_name: player.display_name,
            player_set: playerSet,
            questions,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to load player questions",
        });
    }
}
export async function submitAnswer(req, res) {
    try {
        const sessionId = Number(req.params.sessionId);
        const playerSlot = Number(req.params.playerSlot);
        const { questionId, selectedOptionId, responseTimeSeconds, } = req.body;
        if (!sessionId ||
            ![1, 2].includes(playerSlot) ||
            !questionId ||
            !selectedOptionId) {
            return res.status(400).json({
                message: "Invalid answer data",
            });
        }
        const gameSession = await prisma.gameSession.findUnique({
            where: {
                id: sessionId,
            },
            include: {
                players: true,
            },
        });
        if (!gameSession) {
            return res.status(404).json({
                message: "Game session not found",
            });
        }
        if (gameSession.status !== "in_progress") {
            return res.status(400).json({
                message: "This game session is not active",
            });
        }
        if (gameSession.current_player_slot !== playerSlot) {
            return res.status(400).json({
                message: "It is not this player's turn",
            });
        }
        const player = gameSession.players.find((item) => item.player_slot === playerSlot);
        if (!player) {
            return res.status(404).json({
                message: "Player not found",
            });
        }
        const question = await prisma.question.findUnique({
            where: {
                id: Number(questionId),
            },
            include: {
                options: true,
            },
        });
        if (!question) {
            return res.status(404).json({
                message: "Question not found",
            });
        }
        const expectedPlayerSet = playerSlot === 1 ? "A" : "B";
        if (question.player_set !== expectedPlayerSet) {
            return res.status(400).json({
                message: "This question does not belong to this player",
            });
        }
        const questionPair = await prisma.questionPair.findUnique({
            where: {
                id: question.question_pair_id,
            },
        });
        if (!questionPair || questionPair.quiz_id !== gameSession.quiz_id) {
            return res.status(400).json({
                message: "This question does not belong to this game session",
            });
        }
        if (questionPair.question_order !== gameSession.current_question_order) {
            return res.status(400).json({
                message: "This is not the current question",
            });
        }
        const selectedOption = question.options.find((option) => option.id === Number(selectedOptionId));
        if (!selectedOption) {
            return res.status(400).json({
                message: "Selected option does not belong to this question",
            });
        }
        const existingAnswer = await prisma.playerAnswer.findUnique({
            where: {
                session_player_id_question_id: {
                    session_player_id: player.id,
                    question_id: question.id,
                },
            },
        });
        if (existingAnswer) {
            return res.status(409).json({
                message: "This question has already been answered",
            });
        }
        const correctOption = question.options.find((option) => option.is_correct);
        const answer = await prisma.playerAnswer.create({
            data: {
                session_player_id: player.id,
                question_id: question.id,
                selected_option_id: selectedOption.id,
                is_correct: selectedOption.is_correct,
                timed_out: false,
                response_time_seconds: responseTimeSeconds !== undefined
                    ? Number(responseTimeSeconds)
                    : null,
                answered_at: new Date(),
            },
        });
        await prisma.gameSession.update({
            where: {
                id: sessionId,
            },
            data: {
                current_question_order: gameSession.current_question_order
                    ? gameSession.current_question_order + 1
                    : 1,
            },
        });
        res.status(201).json({
            answer_id: answer.id,
            is_correct: answer.is_correct,
            selected_option_id: selectedOption.id,
            correct_option: correctOption
                ? {
                    id: correctOption.id,
                    option_text: correctOption.option_text,
                }
                : null,
            explanation: question.explanation,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to submit answer",
        });
    }
}
export async function submitTimeout(req, res) {
    try {
        const sessionId = Number(req.params.sessionId);
        const playerSlot = Number(req.params.playerSlot);
        const { questionId } = req.body;
        if (!sessionId || ![1, 2].includes(playerSlot) || !questionId) {
            return res.status(400).json({
                message: "Invalid timeout data",
            });
        }
        const gameSession = await prisma.gameSession.findUnique({
            where: {
                id: sessionId,
            },
            include: {
                players: true,
            },
        });
        if (!gameSession) {
            return res.status(404).json({
                message: "Game session not found",
            });
        }
        if (gameSession.status !== "in_progress") {
            return res.status(400).json({
                message: "This game session is not active",
            });
        }
        if (gameSession.current_player_slot !== playerSlot) {
            return res.status(400).json({
                message: "It is not this player's turn",
            });
        }
        const player = gameSession.players.find((item) => item.player_slot === playerSlot);
        if (!player) {
            return res.status(404).json({
                message: "Player not found",
            });
        }
        const question = await prisma.question.findUnique({
            where: {
                id: Number(questionId),
            },
            include: {
                options: true,
            },
        });
        if (!question) {
            return res.status(404).json({
                message: "Question not found",
            });
        }
        const expectedPlayerSet = playerSlot === 1 ? "A" : "B";
        if (question.player_set !== expectedPlayerSet) {
            return res.status(400).json({
                message: "This question does not belong to this player",
            });
        }
        const questionPair = await prisma.questionPair.findUnique({
            where: {
                id: question.question_pair_id,
            },
        });
        if (!questionPair || questionPair.quiz_id !== gameSession.quiz_id) {
            return res.status(400).json({
                message: "This question does not belong to this game session",
            });
        }
        const existingAnswer = await prisma.playerAnswer.findUnique({
            where: {
                session_player_id_question_id: {
                    session_player_id: player.id,
                    question_id: question.id,
                },
            },
        });
        if (existingAnswer) {
            return res.status(409).json({
                message: "This question has already been answered",
            });
        }
        const correctOption = question.options.find((option) => option.is_correct);
        const answer = await prisma.playerAnswer.create({
            data: {
                session_player_id: player.id,
                question_id: question.id,
                selected_option_id: null,
                is_correct: false,
                timed_out: true,
                response_time_seconds: null,
                answered_at: new Date(),
            },
        });
        await prisma.gameSession.update({
            where: {
                id: sessionId,
            },
            data: {
                current_question_order: gameSession.current_question_order
                    ? gameSession.current_question_order + 1
                    : 1,
            },
        });
        res.status(201).json({
            answer_id: answer.id,
            timed_out: true,
            is_correct: false,
            correct_option: correctOption
                ? {
                    id: correctOption.id,
                    option_text: correctOption.option_text,
                }
                : null,
            explanation: question.explanation,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to record timeout",
        });
    }
}
export async function getPlayerResult(req, res) {
    try {
        const sessionId = Number(req.params.sessionId);
        const playerSlot = Number(req.params.playerSlot);
        if (!sessionId || ![1, 2].includes(playerSlot)) {
            return res.status(400).json({
                message: "Invalid session or player slot",
            });
        }
        const gameSession = await prisma.gameSession.findUnique({
            where: {
                id: sessionId,
            },
            include: {
                players: {
                    include: {
                        answers: true,
                    },
                },
                quiz: true,
            },
        });
        if (!gameSession) {
            return res.status(404).json({
                message: "Game session not found",
            });
        }
        const player = gameSession.players.find((item) => item.player_slot === playerSlot);
        if (!player) {
            return res.status(404).json({
                message: "Player not found",
            });
        }
        const correctAnswers = player.answers.filter((answer) => answer.is_correct).length;
        res.json({
            session_id: gameSession.id,
            player_id: player.id,
            player_slot: player.player_slot,
            display_name: player.display_name,
            correct_answers: correctAnswers,
            total_questions: gameSession.quiz.questions_per_player,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to calculate player result",
        });
    }
}
export async function finishPlayerTurn(req, res) {
    try {
        const sessionId = Number(req.params.sessionId);
        const playerSlot = Number(req.params.playerSlot);
        if (!sessionId || ![1, 2].includes(playerSlot)) {
            return res.status(400).json({
                message: "Invalid session or player slot",
            });
        }
        const gameSession = await prisma.gameSession.findUnique({
            where: {
                id: sessionId,
            },
            include: {
                players: true,
                quiz: true,
            },
        });
        if (!gameSession) {
            return res.status(404).json({
                message: "Game session not found",
            });
        }
        if (gameSession.status !== "in_progress") {
            return res.status(400).json({
                message: "This game session is not active",
            });
        }
        if (gameSession.current_player_slot !== playerSlot) {
            return res.status(400).json({
                message: "It is not this player's turn",
            });
        }
        const player = gameSession.players.find((item) => item.player_slot === playerSlot);
        if (!player) {
            return res.status(404).json({
                message: "Player not found",
            });
        }
        const answerCount = await prisma.playerAnswer.count({
            where: {
                session_player_id: player.id,
            },
        });
        if (answerCount !== gameSession.quiz.questions_per_player) {
            return res.status(400).json({
                message: "Player has not completed all questions yet",
            });
        }
        if (gameSession.current_question_order !==
            gameSession.quiz.questions_per_player + 1) {
            return res.status(400).json({
                message: "Player has not completed the question sequence",
            });
        }
        await prisma.sessionPlayer.update({
            where: {
                id: player.id,
            },
            data: {
                completed_at: new Date(),
            },
        });
        if (playerSlot === 1) {
            await prisma.gameSession.update({
                where: {
                    id: sessionId,
                },
                data: {
                    current_player_slot: 2,
                    current_question_order: 1,
                },
            });
            return res.json({
                message: "Player 1 finished. Player 2 can now start.",
                next_player_slot: 2,
            });
        }
        res.json({
            message: "Player 2 finished. Session is ready for final results.",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to finish player turn",
        });
    }
}
export async function getFinalResults(req, res) {
    try {
        const sessionId = Number(req.params.sessionId);
        if (!sessionId) {
            return res.status(400).json({
                message: "Invalid session ID",
            });
        }
        const gameSession = await prisma.gameSession.findUnique({
            where: {
                id: sessionId,
            },
            include: {
                quiz: true,
                players: {
                    include: {
                        answers: true,
                    },
                    orderBy: {
                        player_slot: "asc",
                    },
                },
            },
        });
        if (!gameSession) {
            return res.status(404).json({
                message: "Game session not found",
            });
        }
        if (gameSession.players.length !== 2) {
            return res.status(400).json({
                message: "Session must contain exactly two players",
            });
        }
        const player1 = gameSession.players[0];
        const player2 = gameSession.players[1];
        if (!player1.completed_at || !player2.completed_at) {
            return res.status(400).json({
                message: "Both players must finish before final results",
            });
        }
        const player1Correct = player1.answers.filter((answer) => answer.is_correct).length;
        const player2Correct = player2.answers.filter((answer) => answer.is_correct).length;
        let resultType;
        let winner = null;
        if (player1Correct > player2Correct) {
            resultType = "winner";
            winner = {
                player_slot: player1.player_slot,
                display_name: player1.display_name,
            };
        }
        else if (player2Correct > player1Correct) {
            resultType = "winner";
            winner = {
                player_slot: player2.player_slot,
                display_name: player2.display_name,
            };
        }
        else {
            resultType = "tie";
        }
        await prisma.gameSession.update({
            where: {
                id: sessionId,
            },
            data: {
                status: "completed",
                completed_at: new Date(),
            },
        });
        res.json({
            session_id: gameSession.id,
            total_questions: gameSession.quiz.questions_per_player,
            players: [
                {
                    player_slot: player1.player_slot,
                    display_name: player1.display_name,
                    correct_answers: player1Correct,
                },
                {
                    player_slot: player2.player_slot,
                    display_name: player2.display_name,
                    correct_answers: player2Correct,
                },
            ],
            result: resultType,
            winner,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to calculate final results",
        });
    }
}
