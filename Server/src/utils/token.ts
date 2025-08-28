import jwt, { Secret } from "jsonwebtoken";
import type { Response } from "express";

type JwtPayload = { id: number; username: string; email: string };

export function signAccess(payload: JwtPayload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as Secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

export function signRefresh(payload: JwtPayload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as Secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

export function setTokens(res: Response, payload: JwtPayload) {
  const access = signAccess(payload);
  const refresh = signRefresh(payload);

  // access는 JSON으로 내려주고, refresh는 HttpOnly 쿠키로
  res.cookie("refresh_token", refresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // 배포 시 true(HTTPS)
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return access;
}

export function clearTokens(res: Response) {
  res.clearCookie("refresh_token");
}

export function verifyAccess(token: string) {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET as string
  ) as JwtPayload;
}

export function verifyRefresh(token: string) {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET as string
  ) as JwtPayload;
}
