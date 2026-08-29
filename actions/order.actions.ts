"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { cancellationRequestSchema } from "@/schemas/review.schema";
import { cancelOrder, CheckoutError } from "@/services/order.service";
import { getOrCreateCart } from "@/services/cart.service";
import { logAudit } from "@/lib/audit";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function requestCancellationAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const parsed = cancellationRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const order = await prisma.order.findFirst({ where: { id: parsed.data.orderId, userId: user.id } });
  if (!order) return { success: false, message: "Pedido não encontrado." };

  if (["PENDING", "PAYMENT_PENDING", "PAID"].includes(order.status)) {
    // Orders not yet shipped can be auto-cancelled immediately.
    try {
      await cancelOrder(order.id, parsed.data.reason, user.id);
      await prisma.cancellationRequest.create({
        data: {
          orderId: order.id,
          userId: user.id,
          reason: parsed.data.reason,
          note: parsed.data.note,
          status: "APPROVED",
        },
      });
      revalidatePath(`/minha-conta/pedidos/${order.id}`);
      return { success: true, message: "Pedido cancelado com sucesso." };
    } catch (err) {
      if (err instanceof CheckoutError) return { success: false, message: err.message };
      throw err;
    }
  }

  await prisma.cancellationRequest.create({
    data: { orderId: order.id, userId: user.id, reason: parsed.data.reason, note: parsed.data.note },
  });
  await logAudit({ userId: user.id, action: "order.request_cancellation", entity: "Order", entityId: order.id });
  revalidatePath(`/minha-conta/pedidos/${order.id}`);

  return { success: true, message: "Solicitação de cancelamento enviada. Nossa equipe irá analisar." };
}

export async function buyAgainAction(orderId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!order) return { success: false, message: "Pedido não encontrado." };

  const cart = await getOrCreateCart(user.id);
  let addedCount = 0;
  let unavailableCount = 0;

  for (const item of order.items) {
    const available = item.variant ? item.variant.stock : item.product.stock;
    const productActive = item.product.status === "ACTIVE";
    if (!productActive || available <= 0) {
      unavailableCount++;
      continue;
    }
    const qty = Math.min(item.quantity, available);
    await prisma.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: item.productId,
          variantId: item.variantId,
        },
      },
      update: { quantity: { increment: qty } },
      create: { cartId: cart.id, productId: item.productId, variantId: item.variantId, quantity: qty },
    });
    addedCount++;
  }

  revalidatePath("/carrinho");

  if (addedCount === 0) {
    return { success: false, message: "Nenhum item deste pedido está disponível no momento." };
  }

  return {
    success: true,
    message:
      unavailableCount > 0
        ? `${addedCount} ite${addedCount > 1 ? "ns" : "m"} adicionado(s). ${unavailableCount} indisponível(is).`
        : "Itens adicionados ao carrinho!",
  };
}
