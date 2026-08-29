import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartWithDetails } from "@/services/cart.service";
import { CartView } from "@/components/storefront/cart-view";
import { GuestCartView } from "@/components/storefront/guest-cart-view";

export const metadata: Metadata = { title: "Carrinho" };

export default async function CartPage() {
  const user = await getCurrentUser();

  return (
    <div className="container-page py-6">
      <h1 className="mb-6 text-2xl font-bold">Meu carrinho</h1>
      {user ? <LoggedCart userId={user.id} /> : <GuestCartView />}
    </div>
  );
}

async function LoggedCart({ userId }: { userId: string }) {
  const cart = await getCartWithDetails(userId);
  const items =
    cart?.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSlug: item.product.slug,
      variantId: item.variantId,
      variantName: item.variant?.name ?? null,
      imageUrl: item.product.images[0]?.url ?? null,
      unitPrice: Number(item.variant?.price ?? item.product.price),
      quantity: item.quantity,
      stock: item.variant?.stock ?? item.product.stock,
    })) ?? [];

  let discount = 0;
  if (cart?.coupon && items.length > 0) {
    const { validateCoupon } = await import("@/services/coupon.service");
    try {
      const result = await validateCoupon(
        cart.coupon.code,
        userId,
        cart.items.map((i) => ({
          productId: i.productId,
          categoryId: i.product.categoryId,
          quantity: i.quantity,
          unitPrice: Number(i.variant?.price ?? i.product.price),
        }))
      );
      discount = result.discount;
    } catch {
      discount = 0;
    }
  }

  return <CartView items={items} coupon={cart?.coupon ? { code: cart.coupon.code } : null} discount={discount} />;
}
