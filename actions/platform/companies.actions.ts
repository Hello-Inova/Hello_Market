"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-session";
import { hashPassword } from "@/lib/auth/password";
import { enterTenant } from "@/lib/tenant/context";
import { createCompanySchema, updateCompanySchema } from "@/schemas/platform.schema";
import type { CompanyStatus } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFromZod(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0])] = issue.message;
  return fieldErrors;
}

export async function createCompanyAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requirePlatformAdmin();

  const parsed = createCompanySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }
  const data = parsed.data;

  const existing = await prisma.company.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return { success: false, message: "Este identificador já está em uso.", fieldErrors: { slug: "Já existe uma empresa com este identificador" } };
  }

  const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
  if (!plan) {
    return { success: false, message: "Plano inválido.", fieldErrors: { planId: "Selecione um plano válido" } };
  }

  const passwordHash = await hashPassword(data.adminPassword);
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const newCompanyId = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: data.name, slug: data.slug, status: "TRIAL" },
    });

    // Company recém-criada: amarra o contexto de tenant a ela ANTES de criar
    // o AdminUser (modelo com escopo de empresa — lib/db.ts injeta o
    // companyId automaticamente a partir deste contexto). Sem isso, o
    // AdminUser cairia por padrão na empresa "hello-market" (fallback de
    // tenant único), já que nenhuma sessão de admin de loja está ativa
    // nesta requisição da plataforma.
    enterTenant({ companyId: company.id, companySlug: company.slug });

    await tx.adminUser.create({
      data: {
        name: data.adminName,
        email: data.adminEmail.toLowerCase(),
        passwordHash,
        role: "SUPER_ADMIN",
      },
    });

    // Subscription não tem escopo de tenant (é consultada só pela
    // plataforma), então recebe companyId explicitamente.
    await tx.subscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        status: "TRIALING",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
      },
    });

    return company.id;
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/empresas");
  redirect(`/plataforma/empresas/${newCompanyId}`);
}

export async function updateCompanyAction(
  companyId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requirePlatformAdmin();

  const parsed = updateCompanySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }
  const data = parsed.data;

  await prisma.company.update({
    where: { id: companyId },
    data: {
      name: data.name,
      legalName: data.legalName || null,
      document: data.document || null,
      email: data.email || null,
      phone: data.phone || null,
      status: data.status as CompanyStatus,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      fontColor: data.fontColor,
      fontFamily: data.fontFamily,
      logoUrl: data.logoUrl || null,
      faviconUrl: data.faviconUrl || null,
    },
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/empresas");
  revalidatePath(`/plataforma/empresas/${companyId}`);

  return { success: true };
}
