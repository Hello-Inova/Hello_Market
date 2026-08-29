"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function toggleCustomerBlockAction(customerId: string, blocked: boolean, reason?: string): Promise<ActionResult> {
  const admin = await requirePermission("customers.edit");

  await prisma.user.update({
    where: { id: customerId },
    data: { blocked, blockedReason: blocked ? (reason ?? "Bloqueado pelo administrador") : null },
  });

  await logAudit({
    adminId: admin.id,
    action: blocked ? "customer.block" : "customer.unblock",
    entity: "User",
    entityId: customerId,
  });

  revalidatePath(`/admin/${admin.companySlug}/clientes/${customerId}`);
  revalidatePath(`/admin/${admin.companySlug}/clientes`);

  return { success: true };
}

export async function updateCustomerNoteAction(customerId: string, note: string): Promise<ActionResult> {
  const admin = await requirePermission("customers.edit");
  // Stored via AuditLog metadata trail since there's no dedicated note field —
  // kept simple and auditable rather than adding a new column mid-flight.
  await logAudit({ adminId: admin.id, action: "customer.note", entity: "User", entityId: customerId, metadata: { note } });
  revalidatePath(`/admin/${admin.companySlug}/clientes/${customerId}`);
  return { success: true };
}
