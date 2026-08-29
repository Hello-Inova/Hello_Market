"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Minus, Plus, Trash2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  updateCartItemAction,
  removeCartItemAction,
  applyCouponToCartAction,
  removeCouponFromCartAction,
} from "@/actions/cart.actions";

export interface CartViewItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string | null;
  variantName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
}

export function CartView({
  items,
  coupon,
  discount,
}: {
  items: CartViewItem[];
  coupon: { code: string } | null;
  discount: number;
}) {
  const router = useRouter();
  const { companySlug } = useParams<{ companySlug: string }>();
  const base = `/loja/${companySlug}`;
  const [isPending, startTransition] = useTransition();
  const [couponCode, setCouponCode] = useState("");

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  function updateQty(itemId: string, qty: number) {
    startTransition(async () => {
      const result = await updateCartItemAction(itemId, qty);
      if (!result.success) toast.error(result.message);
      router.refresh();
    });
  }

  function remove(itemId: string) {
    startTransition(async () => {
      await removeCartItemAction(itemId);
      router.refresh();
    });
  }

  function applyCoupon() {
    if (!couponCode.trim()) return;
    startTransition(async () => {
      const result = await applyCouponToCartAction(couponCode.trim());
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  function removeCoupon() {
    startTransition(async () => {
      await removeCouponFromCartAction();
      router.refresh();
    });
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

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-xl border p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {item.imageUrl && (
                <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="80px" />
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <Link href={`${base}/produto/${item.productSlug}`} className="font-medium hover:text-primary">
                {item.productName}
              </Link>
              {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center rounded-lg border">
                  <button
                    className="p-1.5"
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    disabled={isPending}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    className="p-1.5"
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    disabled={isPending || item.quantity >= item.stock}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            </div>
            <button onClick={() => remove(item.id)} disabled={isPending} aria-label="Remover item">
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>

      <div className="h-fit space-y-4 rounded-xl border p-5">
        <h2 className="font-semibold">Resumo do pedido</h2>

        {coupon ? (
          <div className="flex items-center justify-between rounded-lg bg-green-50 p-2 text-sm text-green-800">
            <span className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" /> {coupon.code}
            </span>
            <button onClick={removeCoupon} className="underline">
              Remover
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Código do cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />
            <Button variant="outline" onClick={applyCoupon} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
            </Button>
          </div>
        )}

        <div className="space-y-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Desconto</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Frete</span>
            <span>Calculado no checkout</span>
          </div>
        </div>

        <div className="flex justify-between border-t pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        <Button size="lg" className="w-full" asChild>
          <Link href={`${base}/checkout`}>Finalizar compra</Link>
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link href={`${base}/produtos`}>Continuar comprando</Link>
        </Button>
      </div>
    </div>
  );
}
