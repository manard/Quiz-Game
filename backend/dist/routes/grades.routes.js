import { Router } from "express";
import { getGrades, createGrade, } from "../controllers/grades.controller";
const router = Router();
router.get("/", getGrades);
router.post("/", createGrade);
export default router;
