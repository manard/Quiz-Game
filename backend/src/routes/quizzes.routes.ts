import { Router } from "express";
import {
  getQuizzes,
  createQuiz,
  publishQuiz,
} from "../controllers/quizzes.controller";

const router = Router();

router.get("/", getQuizzes);
router.post("/", createQuiz);
router.patch("/:id/publish", publishQuiz);

export default router;