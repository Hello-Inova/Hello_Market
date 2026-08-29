"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { adjustStock } from "@/services/inventory.service";
import { notifyLowStock } from "@/services/notification.service";
import { stockAdjustSchema } from "@/schemas/admin.schema";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function adjustProductStockAction(raw: unknown): Promise<ActionResult> {
  const admin = await requirePermission("inventory.edit");
  const parsed = stockAdjustSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { productId, variantId, delta, reason } = parsed.data;

  try {
    const newStock = await prisma.$transaction((tx) =>
      adjustStock(tx, {
        productId,
        variantId: variantId || undefined,
        delta,
        type: "ADJUSTMENT",
        reason,
        userId: admin.id,
      })
    );

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product && newStock > 0 && newStock <= product.minStock) {
      await notifyLowStock(product.id, product.name, newStock);
    }

    await logAudit({
      adminId: admin.id,
      action: "inventory.adjust",
      entity: "Product",
      entityId: productId,
      metadata: { variantId, delta, reason, newStock },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return { success: false, message: "Ajuste inválido: o estoque resultante ficaria negativo." };
    }
    throw err;
  }

  revalidatePath(`/admin/${admin.companySlug}/estoque`);
  revalidatePath(`/admin/${admin.companySlug}/produtos`);

  return { success: true };
}
