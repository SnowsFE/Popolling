import { Router } from "express";
import {
  getPopollings,
  createPopolling,
  getPopolling,
  editPopolling,
  removePopolling,
} from "../controllers/popollingController";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", getPopollings);
router.get("/:id", getPopolling);

// 인증 필요
router.post("/", requireAuth, createPopolling);
router.put("/:id", requireAuth, editPopolling);
router.delete("/:id", requireAuth, removePopolling);

export default router;
