"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { cancelOrder as cancelOrderService, CheckoutError } from "@/services/order.service";
import { sendEmail } from "@/lib/email";
import { orderShippedEmail, orderDeliveredEmail } from "@/emails/templates";
import { createNotification } from "@/services/notification.service";
import type { OrderStatus } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, note?: string): Promise<ActionResult> {
  const admin = await requirePermission("orders.edit");

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { user: true } });

  if (status === "CANCELLED") {
    try {
      await cancelOrderService(orderId, note || "Cancelado pelo administrador", undefined, admin.id);
    } catch (err) {
      if (err instanceof CheckoutError) return { success: false, message: err.message };
      throw err;
    }
    return { success: true };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        shippedAt: status === "SHIPPED" ? new Date() : undefined,
        deliveredAt: status === "DELIVERED" ? new Date() : undefined,
      },
    }),
    prisma.orderStatusHistory.create({ data: { orderId, status, note } }),
  ]);

  if (status === "SHIPPED") {
    await sendEmail({ to: order.user.email, ...orderShippedEmail(order.user.fullName, order.orderNumber, order.trackingCode) });
    await createNotification({ userId: order.userId, type: "ORDER_SHIPPED", title: "Pedido enviado", message: `Seu pedido ${order.orderNumber} foi enviado.`, link: `/minha-conta/pedidos/${order.id}` });
  }
  if (status === "DELIVERED") {
    await sendEmail({ to: order.user.email, ...orderDeliveredEmail(order.user.fullName, order.orderNumber) });
    await createNotification({ userId: order.userId, type: "ORDER_DELIVERED", title: "Pedido entregue", message: `Seu pedido ${order.orderNumber} foi entregue.`, link: `/minha-conta/pedidos/${order.id}` });
  }

  await logAudit({ adminId: admin.id, action: "order.update_status", entity: "Order", entityId: orderId, metadata: { status } });
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");

  return { success: true };
}

export async function updateOrderTrackingAction(orderId: string, carrier: string, trackingCode: string, trackingUrl: string): Promise<ActionResult> {
  const admin = await requirePermission("orders.edit");

  await prisma.order.update({ where: { id: orderId }, data: { carrier, trackingCode, trackingUrl } });
  await logAudit({ adminId: admin.id, action: "order.update_tracking", entity: "Order", entityId: orderId });
  revalidatePath(`/admin/pedidos/${orderId}`);

  return { success: true };
}

export async function updateOrderNoteAction(orderId: string, internalNote: string): Promise<ActionResult> {
  const admin = await requirePermission("orders.edit");
  await prisma.order.update({ where: { id: orderId }, data: { internalNote } });
  await logAudit({ adminId: admin.id, action: "order.update_note", entity: "Order", entityId: orderId });
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true };
}

export async function processRefundAction(orderId: string): Promise<ActionResult> {
  const admin = await requirePermission("orders.edit");

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } }),
    prisma.payment.updateMany({ where: { orderId }, data: { status: "REFUNDED" } }),
    prisma.orderStatusHistory.create({ data: { orderId, status: "REFUNDED", note: "Reembolso processado pelo administrador" } }),
  ]);

  await logAudit({ adminId: admin.id, action: "order.refund", entity: "Order", entityId: orderId });
  revalidatePath(`/admin/pedidos/${orderId}`);

  return { success: true, message: "Reembolso registrado. Integre o gateway de pagamento para efetivar a devolução." };
}

export async function resolveCancellationRequestAction(requestId: string, approve: boolean): Promise<ActionResult> {
  const admin = await requirePermission("orders.edit");

  const request = await prisma.cancellationRequest.findUniqueOrThrow({ where: { id: requestId } });

  if (approve) {
    try {
      await cancelOrderService(request.orderId, request.reason, undefined, admin.id);
    } catch (err) {
      if (err instanceof CheckoutError) return { success: false, message: err.message };
      throw err;
    }
  }

  await prisma.cancellationRequest.update({
    where: { id: requestId },
    data: { status: approve ? "APPROVED" : "REJECTED" },
  });

  await logAudit({ adminId: admin.id, action: "order.resolve_cancellation", entity: "Order", entityId: request.orderId, metadata: { approve } });
  revalidatePath(`/admin/pedidos/${request.orderId}`);

  return { success: true };
}
