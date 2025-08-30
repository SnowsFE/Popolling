import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";
import { notify } from "../utils/notify.js";
import { NotificationType } from "@prisma/client";

const router = Router();

/* like toggle */
router.post("/:portfolioId/like", authRequired, async (req, res) => {
  const portfolioId = Number(req.params.portfolioId);
  const existing = await prisma.like.findUnique({
    where: { portfolioId_userId: { portfolioId, userId: req.user!.id } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return res.json({ message: "Like removed" });
  } else {
    const like = await prisma.like.create({
      data: { portfolioId, userId: req.user!.id },
    });
    const pf = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });
    if (pf && pf.userId !== req.user!.id) {
      await notify(
        pf.userId,
        NotificationType.like,
        `${req.user!.username} liked your portfolio "${pf.title}"`
      );
    }
    return res.json({ message: "Liked", like });
  }
});

/* comment */
router.post("/:portfolioId/comment", authRequired, async (req, res) => {
  const portfolioId = Number(req.params.portfolioId);
  const { content } = req.body;
  const comment = await prisma.comment.create({
    data: { portfolioId, userId: req.user!.id, content },
  });
  const pf = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
  if (pf && pf.userId !== req.user!.id)
    await notify(
      pf.userId,
      NotificationType.comment,
      `${req.user!.username} commented on "${pf.title}"`
    );
  res.json({ message: "Comment added", comment });
});

/* vote upsert */
router.post("/:portfolioId/vote", authRequired, async (req, res) => {
  const portfolioId = Number(req.params.portfolioId);
  const { design = 0, tech = 0, impact = 0 } = req.body;
  const vote = await prisma.vote.upsert({
    where: { portfolioId_userId: { portfolioId, userId: req.user!.id } },
    update: { design, tech, impact },
    create: { portfolioId, userId: req.user!.id, design, tech, impact },
  });
  const pf = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
  if (pf && pf.userId !== req.user!.id)
    await notify(
      pf.userId,
      NotificationType.vote,
      `${req.user!.username} voted on "${pf.title}"`
    );
  res.json({ message: "Voted", vote });
});

/* bookmark toggle */
router.post("/:portfolioId/bookmark", authRequired, async (req, res) => {
  const portfolioId = Number(req.params.portfolioId);
  const existing = await prisma.bookmark.findUnique({
    where: { portfolioId_userId: { portfolioId, userId: req.user!.id } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return res.json({ message: "Bookmark removed" });
  }
  const bm = await prisma.bookmark.create({
    data: { portfolioId, userId: req.user!.id },
  });
  return res.json({ message: "Bookmarked", bm });
});

/* collaborate toggle */
router.post("/:portfolioId/collaborate", authRequired, async (req, res) => {
  const portfolioId = Number(req.params.portfolioId);
  const existing = await prisma.collaborationRequest.findUnique({
    where: { portfolioId_userId: { portfolioId, userId: req.user!.id } },
  });
  if (existing) {
    await prisma.collaborationRequest.delete({ where: { id: existing.id } });
    return res.json({ message: "Collaboration request removed" });
  }
  const collab = await prisma.collaborationRequest.create({
    data: { portfolioId, userId: req.user!.id },
  });
  const pf = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
  if (pf && pf.userId !== req.user!.id)
    await notify(
      pf.userId,
      NotificationType.collaborate,
      `${req.user!.username} wants to collaborate on "${pf.title}"`
    );
  return res.json({ message: "Collaboration request sent", collab });
});

export default router;
