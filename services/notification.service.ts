import "server-only";
import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId?: string; // omit for admin/broadcast notifications
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });
}

export async function notifyLowStock(productId: string, productName: string, stock: number) {
  return createNotification({
    type: "LOW_STOCK",
    title: "Estoque baixo",
    message: `"${productName}" está com apenas ${stock} unidade(s) em estoque`,
    link: `/admin/produtos/${productId}`,
  });
}
