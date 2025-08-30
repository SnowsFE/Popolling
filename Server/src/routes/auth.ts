import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { setTokens, clearTokens } from "../utils/token.js";
import { authRequired } from "../middleware/auth.js";
import { z } from "zod";

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

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });

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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await verifyPassword(password, user.password);
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

router.post("/logout", authRequired, (req, res) => {
  clearTokens(res);
  res.json({ message: "Logged out" });
});

router.get("/me", authRequired, async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
  res.json(me);
});

export default router;
