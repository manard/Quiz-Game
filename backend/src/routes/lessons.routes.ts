import { Router } from "express";
import {
  getLessons,
  createLesson,
} from "../controllers/lessons.controller";

const router = Router();

router.get("/", getLessons);
router.post("/", createLesson);

export default router;