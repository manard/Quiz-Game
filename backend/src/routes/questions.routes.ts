import { Router } from "express";
import { createQuestion } from "../controllers/questions.controller";

const router = Router();

router.post("/", createQuestion);

export default router;