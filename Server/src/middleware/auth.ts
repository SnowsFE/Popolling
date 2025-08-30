import type { Request, Response, NextFunction } from "express";
import { verifyAccess, verifyRefresh, setTokens } from "../utils/token.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; username: string; email: string };
    }
  }
}

export async function authRequired(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    try {
      req.user = verifyAccess(token);
      return next();
    } catch {
      // fallthrough to refresh flow
    }
  }

  const refresh = req.cookies?.refresh_token as string | undefined;
  if (!refresh) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = verifyRefresh(refresh);
    // 새 access 발급 (cookie는 유지)
    const newAccess = setTokens(res, payload);
    // 새 토큰은 헤더에 실어주므로 프론트는 X-Access-Token 확인
    res.setHeader("X-Access-Token", newAccess);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
