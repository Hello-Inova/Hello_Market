import { Star } from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  createdAt: Date;
  user: { firstName: string; lastName: string; avatarUrl: string | null };
}

export function ReviewList({ reviews, avgRating, reviewCount }: { reviews: Review[]; avgRating: number; reviewCount: number }) {
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  if (reviewCount === 0) {
    return <p className="text-sm text-muted-foreground">Este produto ainda não possui avaliações.</p>;
  }

  return (
    <div className="grid gap-8 md:grid-cols-[240px_1fr]">
      <div>
        <div className="text-4xl font-bold">{avgRating.toFixed(1)}</div>
        <div className="my-1 flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{reviewCount} avaliações</p>
        <div className="mt-4 space-y-1">
          {breakdown.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-8">{star}★</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${reviewCount ? (count / reviewCount) * 100 : 0}%` }}
                />
              </div>
              <span className="w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((r) => (
          <div key={r.id} className="border-b pb-6">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold">
                {r.user.avatarUrl ? (
                  <Image src={r.user.avatarUrl} alt="" width={32} height={32} className="object-cover" />
                ) : (
                  r.user.firstName[0]
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{r.user.firstName} {r.user.lastName[0]}.</p>
                <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
              </div>
            </div>
            <div className="mb-1 flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
              ))}
            </div>
            {r.title && <p className="font-medium">{r.title}</p>}
            {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            {r.images.length > 0 && (
              <div className="mt-2 flex gap-2">
                {r.images.map((img, idx) => (
                  <div key={idx} className="relative h-16 w-16 overflow-hidden rounded-lg">
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
