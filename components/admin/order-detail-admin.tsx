"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/order-status";
import {
  updateOrderStatusAction,
  updateOrderTrackingAction,
  updateOrderNoteAction,
  processRefundAction,
  resolveCancellationRequestAction,
} from "@/actions/admin/order.actions";
import type { OrderStatus } from "@prisma/client";

const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "PAYMENT_PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

interface Props {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    subtotal: number;
    discount: number;
    shippingCost: number;
    total: number;
    carrier: string | null;
    trackingCode: string | null;
    trackingUrl: string | null;
    internalNote: string | null;
    customerNote: string | null;
    createdAt: string;
    addressSnapshot: { street: string; number: string; neighborhood: string; city: string; state: string; zipCode: string; recipient: string };
    customer: { fullName: string; email: string; phone: string | null };
    items: { id: string; productName: string; variantName: string | null; sku: string; unitPrice: number; quantity: number; totalPrice: number }[];
    payments: { id: string; method: string; status: string; amount: number; installments: number }[];
    statusHistory: { status: string; note: string | null; createdAt: string }[];
    cancellationRequests: { id: string; reason: string; note: string | null; status: string }[];
  };
}

export function OrderDetailAdmin({ order }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [trackingCode, setTrackingCode] = useState(order.trackingCode ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? "");
  const [internalNote, setInternalNote] = useState(order.internalNote ?? "");

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pedido {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
        <Badge variant={ORDER_STATUS_COLOR[order.status]} className="text-sm">{ORDER_STATUS_LABEL[order.status]}</Badge>
      </div>

      {order.cancellationRequests.filter((r) => r.status === "REQUESTED").map((req) => (
        <Card key={req.id} className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <p className="font-medium">Solicitação de cancelamento pendente</p>
            <p className="text-sm text-muted-foreground">Motivo: {req.reason} {req.note && `— ${req.note}`}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => startTransition(async () => {
                const result = await resolveCancellationRequestAction(req.id, true);
                if (result.success) { toast.success("Cancelamento aprovado."); refresh(); } else toast.error(result.message);
              })}>Aprovar</Button>
              <Button size="sm" variant="outline" onClick={() => startTransition(async () => {
                await resolveCancellationRequestAction(req.id, false);
                toast.success("Solicitação rejeitada.");
                refresh();
              })}>Rejeitar</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Itens</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between border-b py-2 text-sm last:border-0">
                  <div>
                    <p className="font-medium">{item.productName} {item.variantName && `(${item.variantName})`}</p>
                    <p className="text-xs text-muted-foreground">SKU {item.sku} — {item.quantity}x {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Rastreamento</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Transportadora</Label><Input value={carrier} onChange={(e) => setCarrier(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Código de rastreamento</Label><Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Link de rastreamento</Label><Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} /></div>
              <Button
                disabled={isPending}
                onClick={() => startTransition(async () => {
                  await updateOrderTrackingAction(order.id, carrier, trackingCode, trackingUrl);
                  toast.success("Rastreamento atualizado.");
                  refresh();
                })}
              >
                Salvar rastreamento
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Observação interna</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={3} />
              {order.customerNote && <p className="text-xs text-muted-foreground">Observação do cliente: {order.customerNote}</p>}
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => startTransition(async () => {
                  await updateOrderNoteAction(order.id, internalNote);
                  toast.success("Observação salva.");
                })}
              >
                Salvar observação
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {order.statusHistory.map((h, idx) => (
                  <li key={idx} className="flex justify-between border-b pb-2 last:border-0">
                    <span>{ORDER_STATUS_LABEL[h.status] ?? h.status} {h.note && `— ${h.note}`}</span>
                    <span className="text-muted-foreground">{formatDateTime(h.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Alterar status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() => startTransition(async () => {
                  const result = await updateOrderStatusAction(order.id, status);
                  if (result.success) { toast.success("Status atualizado."); refresh(); } else toast.error(result.message);
                })}
              >
                Atualizar status
              </Button>
              {order.status !== "REFUNDED" && order.status !== "CANCELLED" && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isPending}
                  onClick={() => startTransition(async () => {
                    const result = await processRefundAction(order.id);
                    if (result.success) { toast.success(result.message ?? "Reembolso processado."); refresh(); }
                  })}
                >
                  Processar reembolso
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customer.fullName}</p>
              <p className="text-muted-foreground">{order.customer.email}</p>
              {order.customer.phone && <p className="text-muted-foreground">{order.customer.phone}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Endereço de entrega</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {order.addressSnapshot.recipient}<br />
              {order.addressSnapshot.street}, {order.addressSnapshot.number}<br />
              {order.addressSnapshot.neighborhood} — {order.addressSnapshot.city}/{order.addressSnapshot.state}<br />
              {order.addressSnapshot.zipCode}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.payments.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span>{p.method} {p.installments > 1 && `(${p.installments}x)`}</span>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
              ))}
              <div className="space-y-1 border-t pt-2">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-green-700"><span>Desconto</span><span>-{formatCurrency(order.discount)}</span></div>}
                <div className="flex justify-between text-muted-foreground"><span>Frete</span><span>{formatCurrency(order.shippingCost)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
