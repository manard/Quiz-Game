import { Request, Response } from "express";
import { prisma } from "../prismaClient";
import { validateQuizForPublish } from "../services/publishValidation.service";

export async function getQuizzes(req: Request, res: Response) {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        lesson: {
          include: {
            subject: true,
            grade: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch quizzes",
    });
  }
}
export async function publishQuiz(req: Request, res: Response) {
  try {
    const quizId = Number(req.params.id);

    if (!quizId) {
      return res.status(400).json({
        message: "Invalid quiz ID",
      });
    }

    const validation = await validateQuizForPublish(quizId);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const quiz = await prisma.quiz.update({
      where: {
        id: quizId,
      },
      data: {
        status: "published",
      },
    });

    res.json({
      message: "Quiz published successfully",
      quiz,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to publish quiz",
    });
  }
}

export async function createQuiz(req: Request, res: Response) {
  try {
    const {
      lesson_id,
      title,
      description,
      questions_per_player,
    } = req.body;

    if (
      !lesson_id ||
      !title ||
      title.trim() === "" ||
      !description ||
      description.trim() === "" ||
      !questions_per_player ||
      Number(questions_per_player) <= 0
    ) {
      return res.status(400).json({
        message: "All quiz fields are required",
      });
    }

    const quiz = await prisma.quiz.create({
      data: {
        lesson_id: Number(lesson_id),
        title: title.trim(),
        description: description.trim(),
        questions_per_player: Number(questions_per_player),
        status: "draft",
      },
    });

    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create quiz",
    });
  }
}