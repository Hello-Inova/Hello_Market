"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Heart, Loader2, Minus, Plus, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { addToCartAction } from "@/actions/cart.actions";
import { toggleWishlistAction } from "@/actions/wishlist.actions";
import { joinWaitlistAction } from "@/actions/product.actions";
import { addToGuestCart } from "@/lib/guest-cart";

interface Variant {
  id: string;
  name: string;
  options: Record<string, string>;
  price: string | number | null;
  compareAtPrice: string | number | null;
  stock: number;
  imageUrl: string | null;
  active: boolean;
}

interface Props {
  product: {
    id: string;
    name: string;
    price: string | number;
    compareAtPrice: string | number | null;
    stock: number;
    sku: string;
  };
  variants: Variant[];
  isLoggedIn: boolean;
  isFavorited: boolean;
}

export function ProductPurchaseBox({ product, variants, isLoggedIn, isFavorited }: Props) {
  const router = useRouter();
  const { companySlug } = useParams<{ companySlug: string }>();
  const base = `/loja/${companySlug}`;
  const optionGroups = useMemo(() => buildOptionGroups(variants), [variants]);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [key, values] of Object.entries(optionGroups)) {
      if (values.length) initial[key] = values[0];
    }
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return (
      variants.find((v) =>
        Object.entries(selected).every(([key, value]) => v.options[key] === value)
      ) ?? null
    );
  }, [variants, selected]);

  const price = Number(selectedVariant?.price ?? product.price);
  const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const stock = variants.length > 0 ? selectedVariant?.stock ?? 0 : product.stock;
  const outOfStock = stock <= 0;

  async function handleAddToCart(redirectToCheckout = false) {
    setLoading(true);
    try {
      if (!isLoggedIn) {
        addToGuestCart({ productId: product.id, variantId: selectedVariant?.id, quantity });
        toast.success("Adicionado ao carrinho");
        router.push(redirectToCheckout ? `${base}/entrar?next=${base}/checkout` : `${base}/carrinho`);
        return;
      }

      const result = await addToCartAction(product.id, quantity, selectedVariant?.id);
      if (result.success) {
        toast.success("Adicionado ao carrinho");
        router.push(redirectToCheckout ? `${base}/checkout` : `${base}/carrinho`);
        router.refresh();
      } else {
        toast.error(result.message || "Não foi possível adicionar ao carrinho");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFavorite() {
    if (!isLoggedIn) {
      router.push(`${base}/entrar?next=` + encodeURIComponent(window.location.pathname));
      return;
    }
    const result = await toggleWishlistAction(product.id, selectedVariant?.id);
    if (result.success) {
      setFavorited(!!result.added);
      toast.success(result.added ? "Adicionado aos favoritos" : "Removido dos favoritos");
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  }

  async function handleWaitlist() {
    const result = await joinWaitlistAction(product.id, waitlistEmail || undefined);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <div className="space-y-5">
      <div>
        {compareAt && Number(compareAt) > price && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground line-through">{formatCurrency(Number(compareAt))}</span>
            <Badge variant="destructive">
              -{Math.round(((Number(compareAt) - price) / Number(compareAt)) * 100)}%
            </Badge>
          </div>
        )}
        <div className="text-3xl font-bold">{formatCurrency(price)}</div>
        <p className="text-sm text-muted-foreground">até 12x de {formatCurrency(price / 12)} sem juros</p>
      </div>

      {Object.entries(optionGroups).map(([key, values]) => (
        <div key={key}>
          <p className="mb-2 text-sm font-medium capitalize">{key}</p>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => (
              <button
                key={value}
                onClick={() => setSelected((s) => ({ ...s, [key]: value }))}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  selected[key] === value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-input hover:border-primary"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      {outOfStock ? (
        <div className="space-y-3 rounded-xl border border-dashed p-4">
          <p className="font-medium text-destructive">Produto indisponível</p>
          <div className="flex gap-2">
            {!isLoggedIn && (
              <input
                type="email"
                placeholder="seu@email.com"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
            )}
            <Button variant="outline" onClick={handleWaitlist}>
              Avise-me quando chegar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <button
                className="p-2"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                className="p-2"
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">{stock} em estoque</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1" onClick={() => handleAddToCart(false)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar ao carrinho"}
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={() => handleAddToCart(true)} disabled={loading}>
              Comprar agora
            </Button>
          </div>
        </>
      )}

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <button onClick={handleFavorite} className="flex items-center gap-1.5 hover:text-primary">
          <Heart className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
          {favorited ? "Favoritado" : "Favoritar"}
        </button>
        <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-primary">
          <Share2 className="h-4 w-4" /> Compartilhar
        </button>
      </div>

      <p className="text-xs text-muted-foreground">SKU: {selectedVariant?.id ? variants.find(v => v.id === selectedVariant.id)?.name : product.sku}</p>
    </div>
  );
}

function buildOptionGroups(variants: Variant[]): Record<string, string[]> {
  const groups: Record<string, Set<string>> = {};
  for (const v of variants) {
    for (const [key, value] of Object.entries(v.options)) {
      groups[key] = groups[key] || new Set();
      groups[key].add(value);
    }
  }
  const result: Record<string, string[]> = {};
  for (const [key, set] of Object.entries(groups)) {
    result[key] = Array.from(set);
  }
  return result;
}
