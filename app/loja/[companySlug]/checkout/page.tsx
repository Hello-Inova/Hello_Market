import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCheckoutData } from "@/actions/checkout.actions";
import { CheckoutWizard } from "@/components/checkout/checkout-wizard";

export const metadata: Metadata = { title: "Finalizar compra" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const base = `/loja/${companySlug}`;
  const user = await getCurrentUser();
  if (!user) redirect(`${base}/entrar?next=${base}/checkout`);

  const { addresses, cart } = await getCheckoutData(user.id);

  if (!cart || cart.items.length === 0) {
    redirect(`${base}/carrinho`);
  }

  const items = cart.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    productName: item.product.name,
    variantName: item.variant?.name ?? null,
    imageUrl: item.product.images[0]?.url ?? null,
    unitPrice: Number(item.variant?.price ?? item.product.price),
    quantity: item.quantity,
  }));

  return (
    <div className="container-page py-6">
      <h1 className="mb-6 text-2xl font-bold">Finalizar compra</h1>
      <CheckoutWizard
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          recipient: a.recipient,
          zipCode: a.zipCode,
          street: a.street,
          number: a.number,
          complement: a.complement,
          neighborhood: a.neighborhood,
          city: a.city,
          state: a.state,
          isDefault: a.isDefault,
        }))}
        items={items}
        appliedCouponCode={cart.coupon?.code ?? null}
      />
    </div>
  );
}
