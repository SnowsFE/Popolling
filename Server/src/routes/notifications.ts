import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/me", authRequired, async (req, res) => {
  const notifs = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(notifs);
});

router.post("/:id/read", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.notification.update({ where: { id }, data: { read: true } });
  res.json({ message: "Notification marked as read" });
});

export default router;
