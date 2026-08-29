import "server-only";
import { prisma } from "@/lib/db";
import type { Coupon } from "@prisma/client";

export interface CartLineForCoupon {
  productId: string;
  categoryId?: string | null;
  quantity: number;
  unitPrice: number;
}

export class CouponError extends Error {}

export async function validateCoupon(
  code: string,
  userId: string,
  lines: CartLineForCoupon[]
): Promise<{ coupon: Coupon; discount: number; freeShipping: boolean }> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon) throw new CouponError("Cupom não encontrado");
  if (coupon.status !== "ACTIVE") throw new CouponError("Cupom inativo");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new CouponError("Cupom ainda não está válido");
  if (coupon.endsAt && coupon.endsAt < now) throw new CouponError("Cupom expirado");

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new CouponError("Cupom esgotado");
  }

  if (coupon.usageLimitPerUser) {
    const usedByUser = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (usedByUser >= coupon.usageLimitPerUser) {
      throw new CouponError("Você já utilizou este cupom o número máximo de vezes");
    }
  }

  let eligibleLines = lines;
  if (coupon.allowedProductIds.length > 0) {
    eligibleLines = eligibleLines.filter((l) => coupon.allowedProductIds.includes(l.productId));
  }
  if (coupon.allowedCategoryIds.length > 0) {
    eligibleLines = eligibleLines.filter(
      (l) => l.categoryId && coupon.allowedCategoryIds.includes(l.categoryId)
    );
  }
  if ((coupon.allowedProductIds.length > 0 || coupon.allowedCategoryIds.length > 0) && eligibleLines.length === 0) {
    throw new CouponError("Este cupom não se aplica aos itens do carrinho");
  }

  const orderSubtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const eligibleSubtotal = eligibleLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  if (coupon.minOrderValue && orderSubtotal < Number(coupon.minOrderValue)) {
    throw new CouponError(
      `Pedido mínimo de ${coupon.minOrderValue} para usar este cupom`
    );
  }

  if (coupon.type === "FREE_SHIPPING") {
    return { coupon, discount: 0, freeShipping: true };
  }

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = eligibleSubtotal * (Number(coupon.value) / 100);
  } else if (coupon.type === "FIXED") {
    discount = Number(coupon.value);
  }

  if (coupon.maxDiscountValue) {
    discount = Math.min(discount, Number(coupon.maxDiscountValue));
  }
  discount = Math.min(discount, orderSubtotal);

  return { coupon, discount: Math.round(discount * 100) / 100, freeShipping: false };
}
