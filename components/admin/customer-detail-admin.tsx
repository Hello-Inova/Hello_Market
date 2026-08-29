"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/order-status";
import { toggleCustomerBlockAction } from "@/actions/admin/customer.actions";

interface Props {
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    document: string | null;
    birthDate: string | null;
    blocked: boolean;
    blockedReason: string | null;
    marketingOptIn: boolean;
    createdAt: string;
    addresses: { id: string; label: string; street: string; number: string; neighborhood: string; city: string; state: string; zipCode: string; isDefault: boolean }[];
    orders: { id: string; orderNumber: string; status: string; total: number; createdAt: string }[];
    stats: { totalSpent: number; orderCount: number };
  };
}

export function CustomerDetailAdmin({ customer }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState(customer.blockedReason ?? "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{customer.fullName}</h1>
          <p className="text-sm text-muted-foreground">Cliente desde {formatDate(customer.createdAt)}</p>
        </div>
        <Badge variant={customer.blocked ? "destructive" : "success"} className="text-sm">
          {customer.blocked ? "Bloqueado" : "Ativo"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Pedidos ({customer.stats.orderCount})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {customer.orders.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>}
              {customer.orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/pedidos/${o.id}`}
                  className="flex items-center justify-between border-b py-2 text-sm last:border-0 hover:bg-secondary/40"
                >
                  <div>
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={ORDER_STATUS_COLOR[o.status]}>{ORDER_STATUS_LABEL[o.status] ?? o.status}</Badge>
                    <span className="font-semibold">{formatCurrency(o.total)}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Endereços</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {customer.addresses.length === 0 && <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>}
              {customer.addresses.map((a) => (
                <div key={a.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{a.label} {a.isDefault && <Badge variant="outline" className="ml-1">Padrão</Badge>}</p>
                  <p className="text-muted-foreground">{a.street}, {a.number} — {a.neighborhood}, {a.city}/{a.state} — {a.zipCode}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total gasto</span><span className="font-semibold">{formatCurrency(customer.stats.totalSpent)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pedidos</span><span className="font-semibold">{customer.stats.orderCount}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-muted-foreground">{customer.email}</p>
              {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
              {customer.document && <p className="text-muted-foreground">Doc: {customer.document}</p>}
              <p className="text-muted-foreground">Marketing: {customer.marketingOptIn ? "aceito" : "não aceito"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Moderação</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!customer.blocked && (
                <Textarea placeholder="Motivo do bloqueio (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
              )}
              <Button
                variant={customer.blocked ? "outline" : "destructive"}
                className="w-full"
                disabled={isPending}
                onClick={() => startTransition(async () => {
                  const result = await toggleCustomerBlockAction(customer.id, !customer.blocked, reason);
                  if (result.success) { toast.success(customer.blocked ? "Cliente desbloqueado." : "Cliente bloqueado."); router.refresh(); }
                  else toast.error(result.message);
                })}
              >
                {customer.blocked ? "Desbloquear cliente" : "Bloquear cliente"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
