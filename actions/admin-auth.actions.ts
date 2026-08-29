"use server";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession, destroyAdminSession, getCurrentAdmin } from "@/lib/auth/admin-session";
import { enterTenant } from "@/lib/tenant/context";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function adminLoginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const companySlug = String(formData.get("companySlug") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!companySlug) return { success: false, message: "Empresa não identificada." };
  if (!email || !password) return { success: false, message: "Informe e-mail e senha." };

  // O e-mail só é único dentro de uma empresa (Fase 1), então o lookup por
  // e-mail abaixo precisa de um tenant já amarrado — nada disponível ainda
  // nesta rota (é o login, não existe sessão), então resolve pelo slug da
  // própria URL que o formulário carrega.
  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) return { success: false, message: "Empresa não encontrada." };
  enterTenant({ companyId: company.id, companySlug: company.slug });

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { success: false, message: "E-mail ou senha incorretos." };
  }
  if (!admin.active) return { success: false, message: "Este usuário está desativado." };

  await createAdminSession(admin);
  await logAudit({ adminId: admin.id, action: "admin.login" });

  // Redirect no servidor (mesmo padrão de adminLogoutAction) em vez de
  // devolver { success: true } e deixar o cliente navegar via router.push —
  // essa navegação client-side corria contra o router.refresh() logo em
  // seguida e podia perder a corrida, deixando a URL voltar para /login
  // mesmo com a sessão já válida (o sidebar autenticado aparecia por cima
  // do formulário de login). redirect() aqui é determinístico.
  redirect(`/admin/${companySlug}`);
}

export async function adminLogoutAction(companySlug: string) {
  const admin = await getCurrentAdmin();
  if (admin) await logAudit({ adminId: admin.id, action: "admin.logout" });
  await destroyAdminSession();
  redirect(`/admin/${companySlug}/login`);
}
