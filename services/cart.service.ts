import "server-only";
import { prisma } from "@/lib/db";

export async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

export async function getCartWithDetails(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      coupon: true,
      items: {
        include: {
          product: {
            include: { images: { orderBy: { order: "asc" }, take: 1 } },
          },
          variant: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return cart;
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string | null
) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  if (product.status !== "ACTIVE") throw new Error("PRODUCT_UNAVAILABLE");

  const availableStock = variantId
    ? (await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock
    : product.stock;

  if (availableStock < quantity) throw new Error("INSUFFICIENT_STOCK");

  const cart = await getOrCreateCart(userId);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId: {
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
      },
    },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > availableStock) throw new Error("INSUFFICIENT_STOCK");
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty },
    });
  }

  return prisma.cartItem.create({
    data: { cartId: cart.id, productId, variantId: variantId ?? null, quantity },
  });
}

export async function updateCartItemQuantity(userId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    include: { product: true, variant: true },
  });
  if (!item) throw new Error("ITEM_NOT_FOUND");

  const availableStock = item.variant ? item.variant.stock : item.product.stock;
  if (quantity > availableStock) throw new Error("INSUFFICIENT_STOCK");

  if (quantity <= 0) {
    return prisma.cartItem.delete({ where: { id: itemId } });
  }

  return prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
}

export async function removeCartItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId } } });
  if (!item) throw new Error("ITEM_NOT_FOUND");
  return prisma.cartItem.delete({ where: { id: itemId } });
}

export async function mergeGuestCart(
  userId: string,
  guestItems: { productId: string; variantId?: string | null; quantity: number }[]
) {
  for (const item of guestItems) {
    try {
      await addToCart(userId, item.productId, item.quantity, item.variantId);
    } catch {
      // Skip items that are no longer available/in-stock during merge.
    }
  }
}
