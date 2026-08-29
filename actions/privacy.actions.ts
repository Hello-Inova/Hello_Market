"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, destroyAllSessions } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function requestDataExportAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  await prisma.dataRequest.create({ data: { userId: user.id, type: "export" } });
  await logAudit({ userId: user.id, action: "privacy.request_export" });
  revalidatePath("/minha-conta/privacidade");
  return { success: true, message: "Solicitação registrada. Você receberá seus dados por e-mail em até 15 dias, conforme a LGPD." };
}

export async function requestAccountDeletionAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  await prisma.dataRequest.create({ data: { userId: user.id, type: "deletion" } });

  // Deactivate immediately; anonymize personal fields while preserving
  // order history for legally-required bookkeeping (tax/consumer law).
  await prisma.user.update({
    where: { id: user.id },
    data: {
      active: false,
      deletedAt: new Date(),
      email: `deleted-${user.id}@anonymized.martweb.local`,
      firstName: "Usuário",
      lastName: "Removido",
      fullName: "Usuário Removido",
      phone: null,
      document: null,
      avatarUrl: null,
    },
  });

  await destroyAllSessions(user.id, false);
  await logAudit({ userId: user.id, action: "privacy.request_deletion" });

  return { success: true };
}
