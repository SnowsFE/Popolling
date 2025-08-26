import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "dev_access";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "dev_refresh";
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";

export const signAccessToken = (userId: number) => {
  return jwt.sign({ sub: userId }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions);
};

export const signRefreshToken = (userId: number, jti: string) => {
  return jwt.sign({ sub: userId, jti }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;
};

// === 간단한 인메모리 리프레시 세션 저장소 ===
// 배포 시 DB/Redis로 교체
export interface RefreshSession {
  jti: string;
  userId: number;
  tokenHash: string;
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
  replacedBy?: string; // 새 jti
  ua?: string;
  ip?: string;
}

const sessions = new Map<string, RefreshSession>();

const hash = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

export const createRefreshSession = (
  userId: number,
  token: string,
  ua?: string,
  ip?: string
) => {
  const payload = verifyRefreshToken(token);
  const jti = payload.jti as string;
  const exp = payload.exp! * 1000;

  const session: RefreshSession = {
    jti,
    userId,
    tokenHash: hash(token),
    createdAt: Date.now(),
    expiresAt: exp,
    revoked: false,
    ua,
    ip,
  };
  sessions.set(jti, session);
  return session;
};

export const findSession = (jti: string) => sessions.get(jti);

export const revokeSession = (jti: string, replacedBy?: string) => {
  const s = sessions.get(jti);
  if (s) {
    s.revoked = true;
    s.replacedBy = replacedBy;
    sessions.set(jti, s);
  }
};

export const rotateRefreshToken = (
  oldToken: string,
  ua?: string,
  ip?: string
) => {
  const payload = verifyRefreshToken(oldToken);
  const jti = payload.jti as string;
  const session = findSession(jti);
  if (!session) throw new Error("session not found");
  if (session.revoked) throw new Error("session revoked");
  if (session.expiresAt < Date.now()) throw new Error("session expired");
  if (session.tokenHash !== hash(oldToken)) throw new Error("token mismatch");

  // 새 토큰 발급
  const newJti = uuidv4();
  const newToken = signRefreshToken(session.userId, newJti);
  // 기존 세션 revoke
  revokeSession(jti, newJti);
  // 새 세션 저장
  createRefreshSession(session.userId, newToken, ua, ip);
  // 새 액세스 토큰도 함께 발급
  const access = signAccessToken(session.userId);
  return { access, refresh: newToken };
};

export const newTokenPair = (userId: number, ua?: string, ip?: string) => {
  const jti = uuidv4();
  const refresh = signRefreshToken(userId, jti);
  const access = signAccessToken(userId);
  createRefreshSession(userId, refresh, ua, ip);
  return { access, refresh };
};
