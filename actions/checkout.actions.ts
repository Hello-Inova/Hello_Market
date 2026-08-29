"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { getShippingOptions, type ShippingOption } from "@/lib/shipping";
import { getCartWithDetails } from "@/services/cart.service";
import { createOrderFromCart, CheckoutError } from "@/services/order.service";
import { validateCoupon, CouponError } from "@/services/coupon.service";
import { prisma } from "@/lib/db";
import { createOrderSchema } from "@/schemas/checkout.schema";

export interface ShippingQuoteResult {
  success: boolean;
  options?: ShippingOption[];
  message?: string;
}

export async function quoteShippingAction(zipCode: string): Promise<ShippingQuoteResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const cart = await getCartWithDetails(user.id);
  if (!cart || cart.items.length === 0) return { success: false, message: "Carrinho vazio." };

  const totalWeightKg = cart.items.reduce((sum, item) => {
    const weight = Number(item.variant?.weightKg ?? item.product.weightKg ?? 0.3);
    return sum + weight * item.quantity;
  }, 0);
  const subtotal = cart.items.reduce(
    (sum, i) => sum + Number(i.variant?.price ?? i.product.price) * i.quantity,
    0
  );

  try {
    const options = await getShippingOptions({ zipCode, totalWeightKg, subtotal });
    return { success: true, options };
  } catch {
    return { success: false, message: "Não foi possível calcular o frete." };
  }
}

export interface PreviewCouponResult {
  success: boolean;
  discount?: number;
  freeShipping?: boolean;
  message?: string;
}

export async function previewCouponAction(code: string): Promise<PreviewCouponResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const cart = await getCartWithDetails(user.id);
  if (!cart || cart.items.length === 0) return { success: false, message: "Carrinho vazio." };

  try {
    const result = await validateCoupon(
      code,
      user.id,
      cart.items.map((i) => ({
        productId: i.productId,
        categoryId: i.product.categoryId,
        quantity: i.quantity,
        unitPrice: Number(i.variant?.price ?? i.product.price),
      }))
    );
    return { success: true, discount: result.discount, freeShipping: result.freeShipping };
  } catch (err) {
    if (err instanceof CouponError) return { success: false, message: err.message };
    return { success: false, message: "Cupom inválido." };
  }
}

export interface SubmitOrderResult {
  success: boolean;
  message?: string;
  orderId?: string;
  orderNumber?: string;
}

export async function submitOrderAction(input: unknown): Promise<SubmitOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const order = await createOrderFromCart({
      userId: user.id,
      addressId: parsed.data.addressId,
      shippingMethodId: parsed.data.shippingMethodId,
      paymentMethod: parsed.data.paymentMethod,
      installments: parsed.data.installments,
      couponCode: parsed.data.couponCode,
      customerNote: parsed.data.customerNote,
      card: parsed.data.card,
    });

    return { success: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (err) {
    if (err instanceof CheckoutError) return { success: false, message: err.message };
    console.error(err);
    return { success: false, message: "Não foi possível concluir o pedido. Tente novamente." };
  }
}

export async function getCheckoutData(userId: string) {
  const [addresses, cart] = await Promise.all([
    prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }),
    getCartWithDetails(userId),
  ]);
  return { addresses, cart };
}
