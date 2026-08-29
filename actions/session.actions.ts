"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, destroyAllSessions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function terminateSessionAction(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  await prisma.session.deleteMany({ where: { id: sessionId, userId: user.id } });
  await logAudit({ userId: user.id, action: "session.terminate" });
  revalidatePath("/minha-conta/seguranca");
  return { success: true };
}

export async function terminateAllOtherSessionsAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  await destroyAllSessions(user.id, true);
  await logAudit({ userId: user.id, action: "session.terminate_all_others" });
  revalidatePath("/minha-conta/seguranca");
  return { success: true };
}
