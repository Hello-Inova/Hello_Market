"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { moderateReviewAction, deleteReviewAction } from "@/actions/admin/review.actions";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  productName: string;
  customerName: string;
}

export function ReviewModeration({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (reviews.length === 0) {
    return <p className="rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground">Nenhuma avaliação encontrada.</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{r.productName}</p>
                <p className="text-xs text-muted-foreground">{r.customerName} — {formatDateTime(r.createdAt)}</p>
              </div>
              <Badge variant={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "destructive" : "warning"}>
                {r.status === "APPROVED" ? "Aprovada" : r.status === "REJECTED" ? "Rejeitada" : "Pendente"}
              </Badge>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              ))}
            </div>
            {r.title && <p className="text-sm font-medium">{r.title}</p>}
            {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            <div className="flex gap-2 pt-1">
              {r.status !== "APPROVED" && (
                <Button size="sm" disabled={isPending} onClick={() => startTransition(async () => {
                  await moderateReviewAction(r.id, "APPROVED");
                  toast.success("Avaliação aprovada.");
                  router.refresh();
                })}>
                  <Check className="h-3.5 w-3.5" /> Aprovar
                </Button>
              )}
              {r.status !== "REJECTED" && (
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => startTransition(async () => {
                  await moderateReviewAction(r.id, "REJECTED");
                  toast.success("Avaliação rejeitada.");
                  router.refresh();
                })}>
                  <X className="h-3.5 w-3.5" /> Rejeitar
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive" disabled={isPending} onClick={() => startTransition(async () => {
                await deleteReviewAction(r.id);
                toast.success("Avaliação excluída.");
                router.refresh();
              })}>
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
