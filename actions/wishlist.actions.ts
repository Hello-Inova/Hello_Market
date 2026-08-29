"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function toggleWishlistAction(productId: string, variantId?: string | null) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "GUEST" };

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId_variantId: {
        userId: user.id,
        productId,
        variantId: variantId ?? null,
      },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/minha-conta/favoritos");
    return { success: true, added: false };
  }

  await prisma.wishlistItem.create({ data: { userId: user.id, productId, variantId: variantId ?? null } });
  revalidatePath("/minha-conta/favoritos");
  return { success: true, added: true };
}

export async function removeFromWishlistAction(itemId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false };
  await prisma.wishlistItem.deleteMany({ where: { id: itemId, userId: user.id } });
  revalidatePath("/minha-conta/favoritos");
  return { success: true };
}
