import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { WishlistGrid } from "@/components/account/wishlist-grid";

export const metadata: Metadata = { title: "Favoritos" };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: {
      product: { include: { images: { orderBy: { order: "asc" }, take: 1 } } },
      variant: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Meus favoritos</h1>
      <WishlistGrid
        items={items.map((i) => ({
          id: i.id,
          productId: i.productId,
          variantId: i.variantId,
          name: i.product.name,
          slug: i.product.slug,
          price: Number(i.variant?.price ?? i.product.price),
          compareAtPrice: i.product.compareAtPrice ? Number(i.product.compareAtPrice) : null,
          stock: i.variant?.stock ?? i.product.stock,
          imageUrl: i.product.images[0]?.url ?? null,
        }))}
      />
    </div>
  );
}
