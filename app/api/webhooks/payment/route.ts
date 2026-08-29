import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adjustStock } from "@/services/inventory.service";
import { getPaymentGateway } from "@/lib/payments";
import { sendEmail } from "@/lib/email";
import {
  paymentApprovedEmail,
  orderCancelledEmail,
} from "@/emails/templates";
import { createNotification } from "@/services/notification.service";

/**
 * Payment provider webhook. Never trusts the request body's status blindly:
 * 1. Validates the signature (per-provider — MockGateway uses HMAC-SHA256).
 * 2. Deduplicates by eventId (idempotency — a retried webhook is a no-op).
 * 3. Updates Payment + Order status from the verified event only.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");

  const gateway = getPaymentGateway();

  let parsed;
  try {
    parsed = gateway.parseWebhook(rawBody, signature);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Idempotency: if we've already processed this event, acknowledge and exit.
  const existingEvent = await prisma.webhookEvent.findUnique({ where: { eventId: parsed.eventId } });
  if (existingEvent?.processedAt) {
    return NextResponse.json({ received: true, deduped: true });
  }

  const payment = await prisma.payment.findFirst({ where: { externalId: parsed.externalId } });
  if (!payment) {
    return NextResponse.json({ error: "payment not found" }, { status: 404 });
  }

  await prisma.webhookEvent.upsert({
    where: { eventId: parsed.eventId },
    create: {
      provider: gateway.provider as never,
      eventId: parsed.eventId,
      paymentId: payment.id,
      eventType: parsed.eventType,
      payload: JSON.parse(rawBody),
    },
    update: {},
  });

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: payment.orderId },
    include: { items: true, user: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: parsed.status, paidAt: parsed.status === "APPROVED" ? new Date() : payment.paidAt },
    });

    if (parsed.status === "APPROVED" && order.status === "PAYMENT_PENDING") {
      await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "PAID" } });
    }

    if ((parsed.status === "DECLINED" || parsed.status === "CANCELLED") && order.status === "PAYMENT_PENDING") {
      // Release the stock that was reserved at order creation.
      for (const item of order.items) {
        await adjustStock(tx, {
          productId: item.productId,
          variantId: item.variantId,
          delta: item.quantity,
          type: "RELEASE",
          reason: `Pagamento recusado — pedido ${order.orderNumber}`,
          orderId: order.id,
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Pagamento não aprovado" },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "CANCELLED", note: "Pagamento não aprovado" },
      });
    }

    await tx.webhookEvent.update({ where: { eventId: parsed.eventId }, data: { processedAt: new Date() } });
  });

  if (parsed.status === "APPROVED") {
    await sendEmail({ to: order.user.email, ...paymentApprovedEmail(order.user.fullName, order.orderNumber) });
    await createNotification({
      type: "PAYMENT_APPROVED",
      title: "Pagamento aprovado",
      message: `Pedido ${order.orderNumber} — pagamento aprovado`,
      link: `/admin/pedidos/${order.id}`,
    });
  } else if (parsed.status === "DECLINED" || parsed.status === "CANCELLED") {
    await sendEmail({ to: order.user.email, ...orderCancelledEmail(order.user.fullName, order.orderNumber) });
  }

  return NextResponse.json({ received: true });
}
