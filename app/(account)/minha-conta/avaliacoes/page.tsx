import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Minhas avaliações" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Em moderação",
  APPROVED: "Publicada",
  REJECTED: "Rejeitada",
};

export default async function MyReviewsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: { product: { include: { images: { take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Minhas avaliações</h1>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Você ainda não avaliou nenhum produto. Avalie produtos de pedidos entregues na página do pedido.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-4 rounded-xl border p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {review.product.images[0] && (
                  <Image src={review.product.images[0].url} alt="" fill className="object-cover" sizes="64px" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Link href={`/produto/${review.product.slug}`} className="font-medium hover:text-primary">
                    {review.product.name}
                  </Link>
                  <Badge variant={review.status === "APPROVED" ? "success" : review.status === "REJECTED" ? "destructive" : "outline"}>
                    {STATUS_LABEL[review.status]}
                  </Badge>
                </div>
                <div className="my-1 flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                  ))}
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
