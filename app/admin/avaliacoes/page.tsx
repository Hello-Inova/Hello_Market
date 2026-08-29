import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { ReviewModeration } from "@/components/admin/review-moderation";

export const metadata: Metadata = { title: "Avaliações" };

const FILTERS = [
  { key: "PENDING", label: "Pendentes" },
  { key: "APPROVED", label: "Aprovadas" },
  { key: "REJECTED", label: "Rejeitadas" },
  { key: "", label: "Todas" },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = status ?? "PENDING";

  const reviews = await prisma.review.findMany({
    where: activeStatus ? { status: activeStatus as never } : undefined,
    include: { product: { select: { name: true } }, user: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Avaliações</h1>

      <div className="flex gap-1 rounded-lg border bg-white p-1 w-fit">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/avaliacoes?status=${f.key}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              activeStatus === f.key ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <ReviewModeration
        reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          productName: r.product.name,
          customerName: r.user.fullName,
        }))}
      />
    </div>
  );
}
