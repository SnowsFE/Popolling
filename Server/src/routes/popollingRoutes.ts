import { Router } from "express";
import {
  getPopollings,
  createPopolling,
  getPopolling,
  editPopolling,
  removePopolling,
} from "../controllers/popollingController";

const router = Router();

router.get("/", getPopollings);
router.post("/", createPopolling);
router.get("/:id", getPopolling);
router.put("/:id", editPopolling);
router.delete("/:id", removePopolling);

export default router;
