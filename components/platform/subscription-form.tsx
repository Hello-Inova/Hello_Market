"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updateSubscriptionAction } from "@/actions/platform/subscriptions.actions";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PlanOption {
  id: string;
  name: string;
  cycle: "SEMIANNUAL" | "ANNUAL";
  priceCents: number;
}

interface SubscriptionInfo {
  status: string;
  planId: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}

const STATUS_OPTIONS = [
  { value: "TRIALING", label: "Em trial" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "PAST_DUE", label: "Pagamento pendente" },
  { value: "CANCELLED", label: "Cancelada" },
];

export function SubscriptionForm({
  companyId,
  subscription,
  plans,
}: {
  companyId: string;
  subscription: SubscriptionInfo | null;
  plans: PlanOption[];
}) {
  const [isPending, startTransition] = useTransition();

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Esta empresa ainda não tem uma assinatura vinculada.</p>
        </CardContent>
      </Card>
    );
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateSubscriptionAction(companyId, formData);
      if (result.success) toast.success(result.message ?? "Salvo.");
      else toast.error(result.message ?? "Não foi possível salvar.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assinatura</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select name="status" defaultValue={subscription.status} className="w-full rounded-lg border px-3 py-2 text-sm">
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Plano</Label>
            <select name="planId" defaultValue={subscription.planId} className="w-full rounded-lg border px-3 py-2 text-sm">
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.priceCents / 100)} / {p.cycle === "SEMIANNUAL" ? "semestre" : "ano"}
                </option>
              ))}
            </select>
          </div>

          {(subscription.currentPeriodStart || subscription.currentPeriodEnd) && (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Período atual: {subscription.currentPeriodStart ? formatDate(subscription.currentPeriodStart) : "—"} até{" "}
              {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "—"}
            </p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Salvando..." : "Salvar assinatura"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
