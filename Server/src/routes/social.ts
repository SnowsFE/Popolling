import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";
import { notify } from "../utils/notify.js";
import { NotificationType } from "@prisma/client";

const router = Router();

/* follow/unfollow */
router.post("/users/:id/follow", authRequired, async (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user!.id)
    return res.status(400).json({ message: "Cannot follow yourself" });

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: req.user!.id,
        followingId: targetId,
      },
    },
  });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return res.json({ message: "Unfollowed" });
  }

  const follow = await prisma.follow.create({
    data: { followerId: req.user!.id, followingId: targetId },
  });
  await notify(
    targetId,
    NotificationType.follow,
    `${req.user!.username} started following you`
  );
  res.json({ message: "Followed", follow });
});

/* tags set (owner only) */
router.post("/portfolios/:id/tags", authRequired, async (req, res) => {
  const portfolioId = Number(req.params.id);
  const { tags } = req.body as { tags: string[] };
  const pf = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
  if (!pf || pf.userId !== req.user!.id)
    return res.status(403).json({ message: "Forbidden" });

  await prisma.portfolioTag.deleteMany({ where: { portfolioId } });
  const ops = await Promise.all(
    tags.map(async (name) => {
      const tag = await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      return prisma.portfolioTag.create({
        data: { portfolioId, tagId: tag.id },
      });
    })
  );
  res.json({ message: "Tags updated", count: ops.length });
});

export default router;
