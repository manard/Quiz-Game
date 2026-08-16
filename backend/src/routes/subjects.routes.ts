import { Router } from "express";
import {
  getSubjects,
  createSubject,
} from "../controllers/subjects.controller";

const router = Router();

router.get("/", getSubjects);
router.post("/", createSubject);

export default router;