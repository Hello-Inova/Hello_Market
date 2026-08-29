"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { adminUserSchema } from "@/schemas/admin.schema";

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
  revalidatePath("/admin/usuarios");

  return { success: true };
}

export async function toggleAdminUserActiveAction(adminUserId: string, active: boolean): Promise<ActionResult> {
  const actingAdmin = await requirePermission("users.manage");

  if (adminUserId === actingAdmin.id && !active) {
    return { success: false, message: "Você não pode desativar seu próprio usuário." };
  }

  await prisma.adminUser.update({ where: { id: adminUserId }, data: { active } });
  await logAudit({ adminId: actingAdmin.id, action: active ? "admin_user.activate" : "admin_user.deactivate", entity: "AdminUser", entityId: adminUserId });
  revalidatePath("/admin/usuarios");

  return { success: true };
}

export async function deleteAdminUserAction(adminUserId: string): Promise<ActionResult> {
  const actingAdmin = await requirePermission("users.manage");
  if (adminUserId === actingAdmin.id) {
    return { success: false, message: "Você não pode excluir seu próprio usuário." };
  }
  await prisma.adminUser.delete({ where: { id: adminUserId } });
  await logAudit({ adminId: actingAdmin.id, action: "admin_user.delete", entity: "AdminUser", entityId: adminUserId });
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function currentAdminContext() {
  return requireAdmin();
}
