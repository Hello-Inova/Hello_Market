"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { updateProfileSchema } from "@/schemas/auth.schema";
import { isValidImageUrl } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (parsed.data.avatarUrl && !isValidImageUrl(parsed.data.avatarUrl)) {
    return { success: false, message: "URL de imagem inválida." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      fullName: `${parsed.data.firstName} ${parsed.data.lastName}`,
      document: parsed.data.document || null,
      phone: parsed.data.phone || null,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      avatarUrl: parsed.data.avatarUrl || null,
    },
  });

  await logAudit({ userId: user.id, action: "profile.update" });
  revalidatePath("/minha-conta/perfil");

  return { success: true, message: "Perfil atualizado com sucesso." };
}

export async function requestEmailChangeAction(newEmail: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const existing = await prisma.user.findUnique({ where: { email: newEmail.toLowerCase() } });
  if (existing) return { success: false, message: "Este e-mail já está em uso." };

  // In production this would send a confirmation email with a token before
  // applying the change. For this demo build we apply immediately and log it.
  await prisma.user.update({
    where: { id: user.id },
    data: { email: newEmail.toLowerCase(), emailVerifiedAt: null },
  });
  await logAudit({ userId: user.id, action: "profile.change_email", metadata: { newEmail } });

  return { success: true, message: "E-mail atualizado com sucesso." };
}
