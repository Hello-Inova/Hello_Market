"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { updateCompanyThemeSchema } from "@/schemas/platform.schema";

export interface ActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

// Fase 4 — a própria empresa edita o tema da sua loja (cores, fonte, logo,
// favicon). Diferente de actions/platform/companies.actions.ts (usado pelo
// Super Admin da Hello Inova), esta action só altera o Company da empresa
// logada — nunca dados cadastrais/status/assinatura, que ficam exclusivos
// da plataforma.
export async function updateCompanyThemeAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requirePermission("settings.manage");

  const parsed = updateCompanyThemeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { success: false, message: "Verifique os campos destacados.", fieldErrors };
  }
  const data = parsed.data;

  await prisma.company.update({
    where: { id: admin.companyId },
    data: {
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      fontColor: data.fontColor,
      fontFamily: data.fontFamily,
      logoUrl: data.logoUrl || null,
      faviconUrl: data.faviconUrl || null,
    },
  });

  await logAudit({ adminId: admin.id, action: "company.theme.update", entity: "Company", entityId: admin.companyId });
  revalidatePath(`/admin/${admin.companySlug}/configuracoes`);
  revalidatePath(`/loja/${admin.companySlug}`, "layout");

  return { success: true };
}
