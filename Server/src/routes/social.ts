import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";
import { notify } from "../utils/notify.js";
import { NotificationType } from "@prisma/client";

const router = Router();

/* 팔로우/언팔로우 */
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
  } else {
    const follow = await prisma.follow.create({
      data: { followerId: req.user!.id, followingId: targetId },
    });
    await notify(
      targetId,
      NotificationType.follow,
      `${req.user!.username} started following you`
    );
    return res.json({ message: "Followed", follow });
  }
});

/* 포트폴리오 태그 추가/덮어쓰기 */
router.post("/portfolios/:id/tags", authRequired, async (req, res) => {
  const portfolioId = Number(req.params.id);
  const { tags } = req.body as { tags: string[] };

  // 자신 소유만 편집 가능
  const pf = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
  if (!pf || pf.userId !== req.user!.id)
    return res.status(403).json({ message: "Forbidden" });

  // 기존 태그 지우고 새로 세팅
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
