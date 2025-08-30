import { prisma } from "../lib/prisma.js";
import type { NotificationType } from "@prisma/client";

export async function notify(
  userId: number,
  type: NotificationType,
  message: string
) {
  try {
    await prisma.notification.create({ data: { userId, type, message } });
  } catch (e) {
    console.warn("notify error:", e);
  }
}
