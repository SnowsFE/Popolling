import type { Request, Response, NextFunction } from "express";
import { verifyAccess, verifyRefresh, setTokens } from "../utils/token.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; username: string; email: string };
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    try {
      req.user = verifyAccess(token);
      return next();
    } catch {
      /* fall through to refresh */
    }
  }

  // access 만료 시 refresh 쿠키로 재발급
  const refresh = req.cookies?.refresh_token;
  if (!refresh) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = verifyRefresh(refresh);
    const access = setTokens(res, payload); // refresh 재설정 + access 새로 발급
    req.user = payload;
    // 새 access 토큰을 헤더로 내려줘서 클라이언트가 교체하도록
    res.setHeader("X-Access-Token", access);
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
