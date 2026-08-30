"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { adminUserSchema, changeAdminPasswordSchema, changeAdminEmailSchema } from "@/schemas/admin.schema";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function saveAdminUserAction(adminUserId: string | null, raw: unknown): Promise<ActionResult> {
  const actingAdmin = await requirePermission("users.manage");
  const parsed = adminUserSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const data = parsed.data;

  if (data.role === "SUPER_ADMIN" && actingAdmin.role !== "SUPER_ADMIN") {
    return { success: false, message: "Apenas um Super Admin pode conceder o papel de Super Admin." };
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: data.email } });
  if (existing && existing.id !== adminUserId) {
    return { success: false, message: "Já existe um usuário com esse e-mail." };
  }

  if (adminUserId) {
    await prisma.adminUser.update({
      where: { id: adminUserId },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        permissions: data.permissions,
        active: data.active,
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
      },
    });
  } else {
    if (!data.password) return { success: false, message: "Informe uma senha para o novo usuário." };
    await prisma.adminUser.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        permissions: data.permissions,
        active: data.active,
        passwordHash: await hashPassword(data.password),
      },
    });
  }

  await logAudit({ adminId: actingAdmin.id, action: adminUserId ? "admin_user.update" : "admin_user.create", entity: "AdminUser", entityId: adminUserId ?? undefined });
  revalidatePath(`/admin/${actingAdmin.companySlug}/usuarios`);

  return { success: true };
}

export async function toggleAdminUserActiveAction(adminUserId: string, active: boolean): Promise<ActionResult> {
  const actingAdmin = await requirePermission("users.manage");

  if (adminUserId === actingAdmin.id && !active) {
    return { success: false, message: "Você não pode desativar seu próprio usuário." };
  }

  await prisma.adminUser.update({ where: { id: adminUserId }, data: { active } });
  await logAudit({ adminId: actingAdmin.id, action: active ? "admin_user.activate" : "admin_user.deactivate", entity: "AdminUser", entityId: adminUserId });
  revalidatePath(`/admin/${actingAdmin.companySlug}/usuarios`);

  return { success: true };
}

export async function deleteAdminUserAction(adminUserId: string): Promise<ActionResult> {
  const actingAdmin = await requirePermission("users.manage");
  if (adminUserId === actingAdmin.id) {
    return { success: false, message: "Você não pode excluir seu próprio usuário." };
  }
  await prisma.adminUser.delete({ where: { id: adminUserId } });
  await logAudit({ adminId: actingAdmin.id, action: "admin_user.delete", entity: "AdminUser", entityId: adminUserId });
  revalidatePath(`/admin/${actingAdmin.companySlug}/usuarios`);
  return { success: true };
}

export async function currentAdminContext() {
  return requireAdmin();
}

// Autoatendimento: QUALQUER admin logado (independente de papel/permissão)
// pode trocar a PRÓPRIA senha, mediante confirmação da senha atual — por
// isso usa requireAdmin() (sessão válida) em vez de requirePermission()
// (que exigiria "users.manage", pensado para um admin alterando o cadastro
// de outro). Mesmo padrão de changePasswordAction (cliente) e
// changePlatformPasswordAction (plataforma).
export async function changeMyPasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = changeAdminPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) return { success: false, message: "Senha atual incorreta." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });
  await logAudit({ adminId: admin.id, action: "admin_user.change_own_password", entity: "AdminUser", entityId: admin.id });

  return { success: true, message: "Senha alterada com sucesso." };
}

// Autoatendimento: troca do PRÓPRIO e-mail, mediante confirmação da senha
// atual. `AdminUser.email` é único só dentro da empresa
// (`@@unique([companyId, email])`), então a checagem de duplicidade usa
// findFirst (não findUnique) — a extensão de tenant já injeta companyId no
// where automaticamente.
export async function changeMyEmailAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = changeAdminEmailSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) return { success: false, message: "Senha atual incorreta." };

  const newEmail = parsed.data.newEmail.toLowerCase();
  if (newEmail === admin.email.toLowerCase()) {
    return { success: false, message: "Este já é o seu e-mail atual." };
  }

  const existing = await prisma.adminUser.findFirst({ where: { email: newEmail } });
  if (existing) return { success: false, message: "Já existe um usuário com esse e-mail." };

  await prisma.adminUser.update({ where: { id: admin.id }, data: { email: newEmail } });
  await logAudit({ adminId: admin.id, action: "admin_user.change_own_email", entity: "AdminUser", entityId: admin.id, metadata: { newEmail } });

  return { success: true, message: "E-mail alterado com sucesso." };
}
