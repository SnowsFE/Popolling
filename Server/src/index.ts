import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import popollingRoutes from "./routes/popollingRoutes";
import userRoutes from "./routes/users";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // dev 편의
  })
);
app.use(
  cors({
    origin: ORIGIN,
    credentials: true, // 쿠키 허용
  })
);
app.use(express.json());
app.use(cookieParser());

// 로그인/리프레시에만 리미터 적용 (5분에 30회 제한)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { message: "Too many requests, please try again later." },
});

// API 라우트
app.use("/popollings", popollingRoutes);
app.use("/users", userRoutes);

// 특정 경로에만 limiter 적용
app.post("/users/login", authLimiter, (_req, res, next) => next());
app.post("/users/refresh", authLimiter, (_req, res, next) => next());

app.get("/", (_req, res) => {
  res.send("🚀 Popolling secure server ready");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
