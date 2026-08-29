"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import * as cartService from "@/services/cart.service";

export interface CartActionResult {
  success: boolean;
  message?: string;
}

export async function addToCartAction(
  productId: string,
  quantity: number,
  variantId?: string | null
): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "GUEST" }; // handled client-side via guest cart
  }

  try {
    await cartService.addToCart(user.id, productId, quantity, variantId);
    revalidatePath("/carrinho");
    return { success: true };
  } catch (err) {
    const code = err instanceof Error ? err.message : "ERROR";
    const messages: Record<string, string> = {
      INSUFFICIENT_STOCK: "Estoque insuficiente para a quantidade selecionada.",
      PRODUCT_UNAVAILABLE: "Este produto não está mais disponível.",
    };
    return { success: false, message: messages[code] ?? "Não foi possível adicionar ao carrinho." };
  }
}

export async function updateCartItemAction(itemId: string, quantity: number): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  try {
    await cartService.updateCartItemQuantity(user.id, itemId, quantity);
    revalidatePath("/carrinho");
    return { success: true };
  } catch (err) {
    const code = err instanceof Error ? err.message : "ERROR";
    return {
      success: false,
      message: code === "INSUFFICIENT_STOCK" ? "Estoque insuficiente." : "Não foi possível atualizar.",
    };
  }
}

export async function removeCartItemAction(itemId: string): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  await cartService.removeCartItem(user.id, itemId);
  revalidatePath("/carrinho");
  return { success: true };
}

export async function applyCouponToCartAction(code: string): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Faça login para usar cupons." };

  const { prisma } = await import("@/lib/db");
  const { validateCoupon, CouponError } = await import("@/services/coupon.service");

  const cart = await cartService.getCartWithDetails(user.id);
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
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: result.coupon.id } });
    revalidatePath("/carrinho");
    return { success: true, message: "Cupom aplicado!" };
  } catch (err) {
    if (err instanceof CouponError) return { success: false, message: err.message };
    return { success: false, message: "Não foi possível aplicar o cupom." };
  }
}

export async function removeCouponFromCartAction(): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const cart = await cartService.getOrCreateCart(user.id);
  const { prisma } = await import("@/lib/db");
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  revalidatePath("/carrinho");
  return { success: true };
}
