import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

const upsertSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  techStack: z.any().optional(),
  link: z.string().url().optional(),
  feedbackFocus: z.string().optional(),
});

// 생성
router.post("/", authRequired, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: parsed.error.flatten() });
  const portfolio = await prisma.portfolio.create({
    data: { ...parsed.data, userId: req.user!.id },
  });
  res.status(201).json(portfolio);
});

// 목록 (태그/정렬 지원 간단 버전)
router.get("/", async (req, res) => {
  const tag = (req.query.tag as string) || undefined;
  const where = tag ? { tags: { some: { tag: { name: tag } } } } : {};
  const items = await prisma.portfolio.findMany({
    where,
    include: { user: true, tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

// 상세 + 조회수 증가
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.portfolio.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
  const pf = await prisma.portfolio.findUnique({
    where: { id },
    include: {
      user: true,
      comments: true,
      likes: true,
      votes: true,
      tags: { include: { tag: true } },
    },
  });
  res.json(pf);
});

// 수정/삭제
router.put("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: parsed.error.flatten() });

  const target = await prisma.portfolio.findUnique({ where: { id } });
  if (!target || target.userId !== req.user!.id)
    return res.status(403).json({ message: "Forbidden" });

  const updated = await prisma.portfolio.update({
    where: { id },
    data: parsed.data,
  });
  res.json(updated);
});

router.delete("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const target = await prisma.portfolio.findUnique({ where: { id } });
  if (!target || target.userId !== req.user!.id)
    return res.status(403).json({ message: "Forbidden" });
  await prisma.portfolio.delete({ where: { id } });
  res.status(204).end();
});

export default router;
