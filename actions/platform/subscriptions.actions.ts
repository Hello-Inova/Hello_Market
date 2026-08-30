"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/platform-session";
import type { SubscriptionStatus } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  message?: string;
}

const VALID_STATUSES = new Set(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED"]);

// Gestão manual de assinatura — a integração real com o Asaas (cobrança
// recorrente automática, webhooks) é escopo da Fase 5. Até lá, o Super
// Admin ajusta status e plano diretamente aqui.
export async function updateSubscriptionAction(
  companyId: string,
  formData: FormData
): Promise<ActionResult> {
  await requirePlatformAdmin();

  const status = String(formData.get("status") ?? "");
  const planId = String(formData.get("planId") ?? "");

  if (!VALID_STATUSES.has(status)) return { success: false, message: "Status inválido." };

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return { success: false, message: "Plano inválido." };

  const subscription = await prisma.subscription.findUnique({ where: { companyId } });
  if (!subscription) return { success: false, message: "Empresa sem assinatura." };

  await prisma.subscription.update({
    where: { companyId },
    data: {
      status: status as SubscriptionStatus,
      planId,
      cancelledAt: status === "CANCELLED" ? new Date() : null,
    },
  });

  revalidatePath("/plataforma");
  revalidatePath("/plataforma/empresas");
  revalidatePath(`/plataforma/empresas/${companyId}`);
  revalidatePath("/plataforma/assinaturas");

  return { success: true, message: "Assinatura atualizada." };
}
