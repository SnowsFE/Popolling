import { Request, Response } from "express";
import {
  addUser,
  findUserByUsername,
  verifyPassword,
} from "../services/userService";
import { newTokenPair, rotateRefreshToken } from "../utils/jwt";

const REFRESH_COOKIE = "rt";

const cookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const signup = async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ message: "username/password required" });
  if (findUserByUsername(username))
    return res.status(400).json({ message: "이미 존재하는 사용자입니다" });

  const user = await addUser(username, password);
  return res.json({
    message: "회원가입 성공",
    user: { id: user.id, username: user.username },
  });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ message: "username/password required" });

  const user = findUserByUsername(username);
  if (!user)
    return res
      .status(400)
      .json({ message: "아이디 또는 비밀번호가 틀렸습니다" });

  const ok = await verifyPassword(user, password);
  if (!ok)
    return res
      .status(400)
      .json({ message: "아이디 또는 비밀번호가 틀렸습니다" });

  // 토큰 발급 (jwt.ts 사용)
  const { access, refresh } = newTokenPair(
    user.id,
    req.headers["user-agent"],
    req.ip
  );

  // 리프레시 토큰을 httpOnly 쿠키에 저장
  res.cookie(REFRESH_COOKIE, refresh, { ...cookieOptions });
  return res.json({ message: "로그인 성공", accessToken: access });
};

export const refresh = async (req: Request, res: Response) => {
  const rt = req.cookies?.[REFRESH_COOKIE];
  if (!rt) return res.status(401).json({ message: "No refresh token" });

  try {
    const { access, refresh } = rotateRefreshToken(
      rt,
      req.headers["user-agent"],
      req.ip
    );
    res.cookie(REFRESH_COOKIE, refresh, { ...cookieOptions });
    return res.json({ accessToken: access });
  } catch (e: any) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions });
  return res.json({ message: "로그아웃 성공" });
};
