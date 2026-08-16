import { prisma } from "../prismaClient";
export async function getGrades(req, res) {
    try {
        const grades = await prisma.grade.findMany({
            orderBy: {
                grade_number: "asc",
            },
        });
        res.json(grades);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch grades",
        });
    }
}
export async function createGrade(req, res) {
    try {
        const { name, grade_number } = req.body;
        if (!name || !grade_number) {
            return res.status(400).json({
                message: "Grade name and grade number are required",
            });
        }
        const grade = await prisma.grade.create({
            data: {
                name: name.trim(),
                grade_number: Number(grade_number),
            },
        });
        res.status(201).json(grade);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to create grade",
        });
    }
}
