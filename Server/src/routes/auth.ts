import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { setTokens, clearTokens, signAccess } from "../utils/token.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: parsed.error.flatten() });

  const { username, email, password } = parsed.data;
  const dup = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (dup)
    return res
      .status(409)
      .json({ message: "Username or Email already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });

  const access = setTokens(res, { id: user.id, username, email });
  res.json({ user: { id: user.id, username, email }, access });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const access = setTokens(res, {
    id: user.id,
    username: user.username,
    email: user.email,
  });
  res.json({
    user: { id: user.id, username: user.username, email: user.email },
    access,
  });
});

router.post("/logout", (req, res) => {
  clearTokens(res);
  res.json({ message: "Logged out" });
});

router.get("/me", authRequired, async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
  res.json(me);
});

// (선택) 토큰 갱신만 별도 요청
router.post("/refresh", (req, res) => {
  // authRequired가 자동 갱신해주므로 단순 200
  res.json({ ok: true });
});

export default router;
