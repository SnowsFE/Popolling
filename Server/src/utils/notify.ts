import { prisma } from "../lib/prisma.js";
import { NotificationType } from "@prisma/client";

export async function notify(
  userId: number,
  type: NotificationType,
  message: string
) {
  try {
    await prisma.notification.create({ data: { userId, type, message } });
  } catch (e) {
    // 로깅만 하고 무시 (알림 실패로 요청 전체가 실패하지 않게)
    console.warn("notify error:", e);
  }
}
