"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Check, Package, RotateCcw, Star, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_TIMELINE_STEPS } from "@/lib/order-status";
import { requestCancellationAction, buyAgainAction } from "@/actions/order.actions";
import { submitReviewAction } from "@/actions/review.actions";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  hasReview: boolean;
}

interface Props {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    subtotal: number;
    discount: number;
    shippingCost: number;
    total: number;
    trackingCode: string | null;
    trackingUrl: string | null;
    carrier: string | null;
    createdAt: string;
    addressSnapshot: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
    items: OrderItem[];
    canCancel: boolean;
    canReview: boolean;
  };
}

export function OrderDetail({ order }: Props) {
  const router = useRouter();
  const { companySlug } = useParams<{ companySlug: string }>();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<OrderItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentStepIndex = ORDER_TIMELINE_STEPS.indexOf(order.status as never);
  const isCancelledLike = order.status === "CANCELLED" || order.status === "REFUNDED";

  function handleCancel(formData: FormData) {
    formData.set("orderId", order.id);
    startTransition(async () => {
      const result = await requestCancellationAction(formData);
      if (result.success) {
        toast.success(result.message);
        setCancelOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleBuyAgain() {
    startTransition(async () => {
      const result = await buyAgainAction(order.id);
      if (result.success) {
        toast.success(result.message);
        router.push(`/loja/${companySlug}/carrinho`);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleReview(formData: FormData) {
    if (!reviewProduct) return;
    formData.set("productId", reviewProduct.productId);
    formData.set("orderId", order.id);
    startTransition(async () => {
      const result = await submitReviewAction(formData);
      if (result.success) {
        toast.success(result.message);
        setReviewProduct(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pedido {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Realizado em {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {order.canCancel && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              <XCircle className="h-4 w-4" /> Cancelar pedido
            </Button>
          )}
          <Button variant="outline" onClick={handleBuyAgain} disabled={isPending}>
            <RotateCcw className="h-4 w-4" /> Comprar novamente
          </Button>
        </div>
      </div>

      {!isCancelledLike ? (
        <div className="rounded-xl border p-5">
          <div className="flex items-center justify-between">
            {ORDER_TIMELINE_STEPS.map((step, idx) => (
              <div key={step} className="flex flex-1 flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                    idx <= currentStepIndex ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {idx <= currentStepIndex ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span className="mt-1 hidden text-[11px] sm:block">{ORDER_STATUS_LABEL[step]}</span>
              </div>
            ))}
          </div>
          {order.trackingCode && (
            <div className="mt-6 flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm">
              <Truck className="h-4 w-4" />
              <span>
                {order.carrier} — Código: <strong>{order.trackingCode}</strong>
              </span>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="ml-auto text-primary hover:underline">
                  Rastrear
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <Badge variant="destructive" className="text-sm">
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <h2 className="font-semibold">Itens do pedido</h2>
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-xl border p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {item.imageUrl && <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="64px" />}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
                <p className="text-xs text-muted-foreground">
                  {item.quantity}x {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
                {order.canReview && !item.hasReview && (
                  <button
                    onClick={() => setReviewProduct(item)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Star className="h-3 w-3" /> Avaliar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit space-y-3 rounded-xl border p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Package className="h-4 w-4" /> Entrega
          </h2>
          <p className="text-sm text-muted-foreground">
            {order.addressSnapshot.street}, {order.addressSnapshot.number} — {order.addressSnapshot.neighborhood}
            <br />
            {order.addressSnapshot.city}/{order.addressSnapshot.state} — {order.addressSnapshot.zipCode}
          </p>
          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-700"><span>Desconto</span><span>-{formatCurrency(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{order.shippingCost === 0 ? "Grátis" : formatCurrency(order.shippingCost)}</span></div>
          </div>
          <div className="flex justify-between border-t pt-3 font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
          </DialogHeader>
          <form action={handleCancel} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Motivo</label>
              <Input name="reason" required placeholder="Ex: Comprei por engano" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observação (opcional)</label>
              <Textarea name="note" rows={3} />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Enviando..." : "Confirmar cancelamento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewProduct} onOpenChange={(v) => !v && setReviewProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar {reviewProduct?.productName}</DialogTitle>
          </DialogHeader>
          <ReviewFormInner onSubmit={handleReview} isPending={isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewFormInner({ onSubmit, isPending }: { onSubmit: (fd: FormData) => void; isPending: boolean }) {
  const [rating, setRating] = useState(5);
  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)}>
            <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
          </button>
        ))}
      </div>
      <Input name="title" placeholder="Título (opcional)" />
      <Textarea name="comment" placeholder="Conte sua experiência com o produto" rows={4} />
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </form>
  );
}
