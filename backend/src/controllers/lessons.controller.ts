import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function getLessons(req: Request, res: Response) {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        subject: true,
        grade: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch lessons",
    });
  }
}

export async function createLesson(req: Request, res: Response) {
  try {
    const { subject_id, grade_id, name, description } = req.body;

    if (!subject_id || !grade_id || !name || name.trim() === "") {
      return res.status(400).json({
        message: "Subject, grade and lesson name are required",
      });
    }

    const lesson = await prisma.lesson.create({
      data: {
        subject_id: Number(subject_id),
        grade_id: Number(grade_id),
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: {
        subject: true,
        grade: true,
      },
    });

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create lesson",
    });
  }
}