"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { updateProfileSchema, changeEmailSchema } from "@/schemas/auth.schema";
import { isValidImageUrl } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { verifyPassword } from "@/lib/auth/password";

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

// Autoatendimento: troca do PRÓPRIO e-mail, mediante confirmação da senha
// atual (mesmo padrão de changePasswordAction acima). `User.email` é único
// só dentro da empresa (`@@unique([companyId, email])` desde a Fase 1), então
// a checagem de duplicidade usa findFirst (não findUnique) — a extensão de
// tenant do lib/db.ts já injeta companyId no where automaticamente.
export async function requestEmailChangeAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const parsed = changeEmailSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { success: false, message: "Senha atual incorreta." };

  const newEmail = parsed.data.newEmail.toLowerCase();
  if (newEmail === user.email.toLowerCase()) {
    return { success: false, message: "Este já é o seu e-mail atual." };
  }

  const existing = await prisma.user.findFirst({ where: { email: newEmail } });
  if (existing) return { success: false, message: "Este e-mail já está em uso." };

  // Em produção isso enviaria um e-mail de confirmação com token antes de
  // aplicar a troca. Nesta versão de demonstração aplicamos imediatamente e
  // registramos em auditoria — mesmo padrão de graceful-degradation já usado
  // para pagamentos/e-mail/frete/storage neste projeto.
  await prisma.user.update({
    where: { id: user.id },
    data: { email: newEmail, emailVerifiedAt: null },
  });
  await logAudit({ userId: user.id, action: "profile.change_email", metadata: { newEmail } });

  return { success: true, message: "E-mail atualizado com sucesso." };
}
