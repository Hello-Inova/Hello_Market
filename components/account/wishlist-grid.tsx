"use client";

import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { removeFromWishlistAction } from "@/actions/wishlist.actions";
import { addToCartAction } from "@/actions/cart.actions";

interface Item {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
}

export function WishlistGrid({ items }: { items: Item[] }) {
  const { companySlug } = useParams<{ companySlug: string }>();
  const base = `/loja/${companySlug}`;
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        Você ainda não favoritou nenhum produto.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border">
          <Link href={`${base}/produto/${item.slug}`} className="relative block aspect-square bg-secondary">
            {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="200px" />}
          </Link>
          <div className="p-3">
            <Link href={`${base}/produto/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
              {item.name}
            </Link>
            <p className="mt-1 font-bold">{formatCurrency(item.price)}</p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={isPending || item.stock === 0}
                onClick={() =>
                  startTransition(async () => {
                    const result = await addToCartAction(item.productId, 1, item.variantId);
                    if (result.success) toast.success("Adicionado ao carrinho");
                    else toast.error(result.message);
                  })
                }
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  startTransition(async () => {
                    await removeFromWishlistAction(item.id);
                  })
                }
              >
                <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
