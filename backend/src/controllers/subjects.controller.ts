import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function getSubjects(req: Request, res: Response) {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch subjects",
    });
  }
}
export async function createSubject(req: Request, res: Response) {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Subject name is required",
      });
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
      },
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create subject",
    });
  }
}