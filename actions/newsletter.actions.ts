"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const schema = z.object({ email: z.string().email() });

export async function subscribeNewsletter(formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, message: "E-mail inválido" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: { newsletter: true },
      create: { userId: user.id, newsletter: true },
    });
  }

  await logAudit({ action: "newsletter.subscribe", metadata: { email: parsed.data.email } });

  return { success: true, message: "Inscrição realizada com sucesso!" };
}
