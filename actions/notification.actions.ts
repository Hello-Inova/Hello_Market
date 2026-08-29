"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function updateNotificationPreferencesAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  const data = {
    orderUpdates: formData.get("orderUpdates") === "on",
    promotions: formData.get("promotions") === "on",
    newsletter: formData.get("newsletter") === "on",
    emailEnabled: formData.get("emailEnabled") === "on",
    whatsappEnabled: formData.get("whatsappEnabled") === "on",
    pushEnabled: formData.get("pushEnabled") === "on",
  };

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  revalidatePath("/minha-conta/notificacoes");
  return { success: true };
}

export async function markNotificationReadAction(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false };
  await prisma.notification.updateMany({ where: { id: notificationId, userId: user.id }, data: { read: true } });
  revalidatePath("/minha-conta/notificacoes");
  return { success: true };
}
