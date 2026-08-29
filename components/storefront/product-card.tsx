import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: number | string;
  compareAtPrice: number | string | null;
  stock: number;
  avgRating: number | string;
  reviewCount: number;
  images: { url: string; altText?: string | null }[];
}

export function ProductCard({ product, basePath }: { product: ProductCardData; basePath: string }) {
  const price = Number(product.price);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discountPct = compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;
  const image = product.images[0];

  return (
    <Link
      href={`${basePath}/produto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-secondary">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem imagem</div>
        )}
        {discountPct && (
          <Badge variant="destructive" className="absolute left-2 top-2">
            -{discountPct}%
          </Badge>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded bg-white px-2 py-1 text-xs font-semibold">Indisponível</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {Number(product.avgRating).toFixed(1)} ({product.reviewCount})
          </div>
        )}
        <div className="mt-auto pt-1">
          {compareAt && compareAt > price && (
            <span className="block text-xs text-muted-foreground line-through">
              {formatCurrency(compareAt)}
            </span>
          )}
          <span className="text-lg font-bold text-foreground">{formatCurrency(price)}</span>
          <span className="block text-xs text-muted-foreground">
            até 12x de {formatCurrency(price / 12)}
          </span>
        </div>
      </div>
    </Link>
  );
}
