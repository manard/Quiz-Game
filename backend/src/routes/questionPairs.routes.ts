import { Router } from "express";
import {
  getQuestionPairs,
  createQuestionPair,
} from "../controllers/questionPairs.controller";

const router = Router();

router.get("/quiz/:quizId", getQuestionPairs);
router.post("/", createQuestionPair);

export default router;