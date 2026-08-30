"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import {
  createPlatformSession,
  destroyPlatformSession,
  requirePlatformAdmin,
} from "@/lib/auth/platform-session";
import { changePlatformPasswordSchema } from "@/schemas/platform.schema";

// Nota: lib/audit.ts (logAudit) grava em AuditLog, que é um modelo com
// escopo de empresa (companyId obrigatório) — pensado para ações dentro de
// UMA loja. Ações do Super Admin da plataforma não pertencem a nenhuma
// empresa específica (o próprio ponto do papel é enxergar todas), então
// não usamos logAudit aqui para não atribuir essas ações a uma empresa
// arbitrária (o fallback de tenant único). Um log de auditoria dedicado à
// plataforma fica como melhoria futura, fora do escopo desta fase.

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function platformLoginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { success: false, message: "Informe e-mail e senha." };

  const admin = await prisma.platformAdmin.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { success: false, message: "E-mail ou senha incorretos." };
  }
  if (!admin.active) return { success: false, message: "Este usuário está desativado." };

  await createPlatformSession(admin);

  // Redirect no servidor (mesmo padrão usado no login admin de loja) para
  // evitar a corrida entre navegação client-side e o cookie de sessão ainda
  // sendo propagado.
  redirect("/plataforma");
}

export async function platformLogoutAction() {
  await destroyPlatformSession();
  redirect("/plataforma/login");
}

export async function changePlatformPasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();

  const parsed = changePlatformPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) return { success: false, message: "Senha atual incorreta." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.platformAdmin.update({ where: { id: admin.id }, data: { passwordHash } });

  return { success: true, message: "Senha alterada com sucesso." };
}
