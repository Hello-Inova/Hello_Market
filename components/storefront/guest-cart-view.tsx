"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { readGuestCart, updateGuestCartQuantity, type GuestCartItem } from "@/lib/guest-cart";

interface HydratedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: { url: string }[];
  variants: { id: string; name: string; price: number | null; stock: number }[];
  stock: number;
}

export function GuestCartView() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const base = `/loja/${companySlug}`;
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [products, setProducts] = useState<Record<string, HydratedProduct>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage is an external system with no subscription API here, so
    // reading it once on mount and syncing the snapshot into state is the
    // correct pattern (see react.dev "You Might Not Need an Effect").
    const guestItems = readGuestCart();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(guestItems);

    if (guestItems.length === 0) {
      setLoading(false);
      return;
    }

    fetch("/api/products/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: guestItems.map((i) => i.productId) }),
    })
      .then((res) => res.json())
      .then((data: { products: HydratedProduct[] } & Record<string, unknown>) => {
        const map: Record<string, HydratedProduct> = {};
        for (const p of data.products) map[p.id] = p;
        setProducts(map);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateQty(item: GuestCartItem, qty: number) {
    const next = updateGuestCartQuantity(item.productId, item.variantId, qty);
    setItems(next);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando carrinho...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-16 text-center">
        <p className="mb-4 text-muted-foreground">Seu carrinho está vazio.</p>
        <Button asChild>
          <Link href={`${base}/produtos`}>Continuar comprando</Link>
        </Button>
      </div>
    );
  }

  const rows = items
    .map((item) => {
      const product = products[item.productId];
      if (!product) return null;
      const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : null;
      const price = variant?.price ?? product.price;
      const stock = variant?.stock ?? product.stock;
      return { item, product, variant, price, stock };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const subtotal = rows.reduce((sum, row) => sum + row.price * row.item.quantity, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {rows.map(({ item, product, variant, price, stock }) => (
          <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex gap-4 rounded-xl border p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {product.images[0] && (
                <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="80px" />
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <Link href={`${base}/produto/${product.slug}`} className="font-medium hover:text-primary">
                {product.name}
              </Link>
              {variant && <p className="text-xs text-muted-foreground">{variant.name}</p>}
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center rounded-lg border">
                  <button className="p-1.5" onClick={() => updateQty(item, item.quantity - 1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button className="p-1.5" onClick={() => updateQty(item, item.quantity + 1)} disabled={item.quantity >= stock}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="font-semibold">{formatCurrency(price * item.quantity)}</span>
              </div>
            </div>
            <button onClick={() => updateQty(item, 0)} aria-label="Remover item">
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>

      <div className="h-fit space-y-4 rounded-xl border p-5">
        <h2 className="font-semibold">Resumo do pedido</h2>
        <div className="flex justify-between border-t pt-3 text-lg font-bold">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Cupons e frete disponíveis após o login. Faça login ou crie sua conta para finalizar a compra — seus
          itens serão mantidos.
        </p>
        <Button size="lg" className="w-full" asChild>
          <Link href={`${base}/entrar?next=${base}/checkout`}>Entrar para finalizar</Link>
        </Button>
        <Button variant="outline" size="lg" className="w-full" asChild>
          <Link href={`${base}/cadastro`}>Criar conta</Link>
        </Button>
      </div>
    </div>
  );
}
