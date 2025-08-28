import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import portfolioRoutes from "./routes/portfolios.js";
import interactionRoutes from "./routes/interactions.js";
import socialRoutes from "./routes/social.js";
import notificationRoutes from "./routes/notifications.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const origins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: origins.length ? origins : true, credentials: true }));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/portfolios", portfolioRoutes);
app.use("/interactions", interactionRoutes);
app.use("/social", socialRoutes);
app.use("/notifications", notificationRoutes);

// 404
app.use((_, res) => res.status(404).json({ message: "Not Found" }));

// 에러 핸들러(필요시 확장)
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`🚀 Popolling API running on http://localhost:${port}`);
});
