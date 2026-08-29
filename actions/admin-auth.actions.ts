"use server";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession, destroyAdminSession, getCurrentAdmin } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function adminLoginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { success: false, message: "Informe e-mail e senha." };

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { success: false, message: "E-mail ou senha incorretos." };
  }
  if (!admin.active) return { success: false, message: "Este usuário está desativado." };

  await createAdminSession(admin);
  await logAudit({ adminId: admin.id, action: "admin.login" });

  return { success: true };
}

export async function adminLogoutAction() {
  const admin = await getCurrentAdmin();
  if (admin) await logAudit({ adminId: admin.id, action: "admin.logout" });
  await destroyAdminSession();
  redirect("/admin/login");
}
