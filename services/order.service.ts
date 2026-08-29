import "server-only";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { adjustStock } from "./inventory.service";
import { validateCoupon, CouponError } from "./coupon.service";
import { getShippingOptions } from "@/lib/shipping";
import { getPaymentGateway } from "@/lib/payments";
import { sendEmail } from "@/lib/email";
import { orderReceivedEmail } from "@/emails/templates";
import { createNotification } from "./notification.service";
import { logAudit } from "@/lib/audit";
import type { PaymentMethodType } from "@/lib/payments/types";

export class CheckoutError extends Error {
  constructor(message: string, public code: string = "CHECKOUT_ERROR") {
    super(message);
  }
}

interface CreateOrderParams {
  userId: string;
  addressId: string;
  shippingMethodId: string;
  paymentMethod: PaymentMethodType;
  installments?: number;
  couponCode?: string;
  customerNote?: string;
  card?: { number: string; holderName: string; expiry: string; cvv: string };
}

/**
 * Server-authoritative checkout. Never trusts any price/stock/discount
 * value coming from the client — everything is re-derived from the
 * database inside a single transaction, per spec section 22.
 */
export async function createOrderFromCart(params: CreateOrderParams) {
  const cart = await prisma.cart.findUnique({
    where: { userId: params.userId },
    include: {
      items: {
        include: { product: true, variant: true },
      },
      coupon: true,
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new CheckoutError("Carrinho vazio", "EMPTY_CART");
  }

  const address = await prisma.address.findFirst({
    where: { id: params.addressId, userId: params.userId },
  });
  if (!address) throw new CheckoutError("Endereço inválido", "INVALID_ADDRESS");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });

  // 1. Re-validate every line against the DB (price + stock)
  const lines = cart.items.map((item) => {
    if (item.product.status !== "ACTIVE") {
      throw new CheckoutError(`"${item.product.name}" não está mais disponível`, "PRODUCT_UNAVAILABLE");
    }
    const availableStock = item.variant ? item.variant.stock : item.product.stock;
    if (availableStock < item.quantity) {
      throw new CheckoutError(
        `Estoque insuficiente para "${item.product.name}"`,
        "INSUFFICIENT_STOCK"
      );
    }
    const unitPrice = Number(item.variant?.price ?? item.product.price);
    return {
      productId: item.productId,
      variantId: item.variantId,
      categoryId: item.product.categoryId,
      productName: item.product.name,
      variantName: item.variant?.name,
      sku: item.variant?.sku ?? item.product.sku,
      quantity: item.quantity,
      unitPrice,
      totalPrice: Math.round(unitPrice * item.quantity * 100) / 100,
    };
  });

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.totalPrice, 0) * 100) / 100;

  // 2. Re-validate coupon server-side (never trust discount from the client)
  let discount = 0;
  let freeShipping = false;
  let appliedCoupon = null as Awaited<ReturnType<typeof validateCoupon>>["coupon"] | null;
  const couponCode = params.couponCode ?? cart.coupon?.code;
  if (couponCode) {
    try {
      const result = await validateCoupon(
        couponCode,
        params.userId,
        lines.map((l) => ({
          productId: l.productId,
          categoryId: l.categoryId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        }))
      );
      discount = result.discount;
      freeShipping = result.freeShipping;
      appliedCoupon = result.coupon;
    } catch (err) {
      if (err instanceof CouponError) throw new CheckoutError(err.message, "INVALID_COUPON");
      throw err;
    }
  }

  // 3. Re-calculate shipping server-side
  const totalWeightKg = cart.items.reduce((sum, item) => {
    const weight = Number(item.variant?.weightKg ?? item.product.weightKg ?? 0.3);
    return sum + weight * item.quantity;
  }, 0);
  const shippingOptions = await getShippingOptions({
    zipCode: address.zipCode,
    totalWeightKg,
    subtotal,
  });
  const shippingOption = shippingOptions.find((o) => o.id === params.shippingMethodId);
  if (!shippingOption) throw new CheckoutError("Forma de entrega inválida", "INVALID_SHIPPING");
  const shippingCost = freeShipping ? 0 : shippingOption.price;

  const total = Math.round((subtotal - discount + shippingCost) * 100) / 100;
  if (total < 0) throw new CheckoutError("Total do pedido inválido", "INVALID_TOTAL");

  // 4. Persist everything inside one transaction: order, items, stock, coupon usage
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: params.userId,
        addressId: address.id,
        addressSnapshot: {
          label: address.label,
          recipient: address.recipient,
          zipCode: address.zipCode,
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          country: address.country,
        },
        status: "PAYMENT_PENDING",
        subtotal,
        discount,
        shippingCost,
        total,
        couponId: appliedCoupon?.id,
        shippingMethod: shippingOption.name,
        shippingDays: shippingOption.days,
        carrier: shippingOption.carrier,
        customerNote: params.customerNote,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            productName: l.productName,
            variantName: l.variantName,
            sku: l.sku,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            totalPrice: l.totalPrice,
          })),
        },
        statusHistory: {
          create: [{ status: "PENDING" }, { status: "PAYMENT_PENDING" }],
        },
      },
    });

    // Reserve stock (decrement immediately to prevent overselling while payment is pending)
    for (const line of lines) {
      await adjustStock(tx, {
        productId: line.productId,
        variantId: line.variantId,
        delta: -line.quantity,
        type: "SALE",
        reason: `Pedido ${created.orderNumber}`,
        orderId: created.id,
      });
      await tx.product.update({
        where: { id: line.productId },
        data: { soldCount: { increment: line.quantity } },
      });
    }

    if (appliedCoupon) {
      await tx.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: { increment: 1 } },
      });
      await tx.couponUsage.create({
        data: { couponId: appliedCoupon.id, userId: params.userId, orderId: created.id },
      });
    }

    // Create the payment charge
    const gateway = getPaymentGateway();
    const charge = await gateway.createCharge({
      orderId: created.id,
      orderNumber: created.orderNumber,
      amount: total,
      method: params.paymentMethod,
      installments: params.installments,
      customer: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        document: user.document,
      },
      card: params.card,
    });

    const paymentStatus =
      charge.status === "APPROVED" ? "APPROVED" : charge.status === "DECLINED" ? "DECLINED" : "PENDING";

    await tx.payment.create({
      data: {
        orderId: created.id,
        method: params.paymentMethod,
        provider: gateway.provider as never,
        status: paymentStatus,
        amount: total,
        installments: params.installments ?? 1,
        externalId: charge.externalId,
        pixQrCode: charge.pixQrCode,
        pixCopyPaste: charge.pixCopyPaste,
        boletoUrl: charge.boletoUrl,
        boletoBarcode: charge.boletoBarcode,
        cardLast4: charge.cardLast4,
        cardBrand: charge.cardBrand,
        paidAt: paymentStatus === "APPROVED" ? new Date() : null,
      },
    });

    if (paymentStatus === "DECLINED") {
      throw new CheckoutError("Pagamento recusado. Verifique os dados do cartão.", "PAYMENT_DECLINED");
    }

    if (paymentStatus === "APPROVED") {
      await tx.order.update({
        where: { id: created.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      await tx.orderStatusHistory.create({ data: { orderId: created.id, status: "PAID" } });
    }

    // Clear the cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });

    return created;
  });

  await sendEmail({
    to: user.email,
    ...orderReceivedEmail(user.fullName, order.orderNumber, total),
  });

  await createNotification({
    type: "NEW_ORDER",
    title: "Novo pedido",
    message: `Pedido ${order.orderNumber} de ${user.fullName} — ${lines.length} ite${lines.length > 1 ? "ns" : "m"}`,
    link: `/admin/pedidos/${order.id}`,
  });

  await logAudit({
    userId: params.userId,
    action: "order.create",
    entity: "Order",
    entityId: order.id,
    metadata: { total, orderNumber: order.orderNumber },
  });

  return order;
}

export async function cancelOrder(orderId: string, reason: string, actorUserId?: string, actorAdminId?: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    if (["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)) {
      throw new CheckoutError("Este pedido não pode mais ser cancelado", "CANNOT_CANCEL");
    }

    // Release reserved stock back
    for (const item of order.items) {
      await adjustStock(tx, {
        productId: item.productId,
        variantId: item.variantId,
        delta: item.quantity,
        type: "RELEASE",
        reason: `Cancelamento pedido ${order.orderNumber}`,
        orderId: order.id,
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "CANCELLED", note: reason },
    });
  });

  await logAudit({
    userId: actorUserId,
    adminId: actorAdminId,
    action: "order.cancel",
    entity: "Order",
    entityId: orderId,
    metadata: { reason },
  });
}
