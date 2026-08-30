import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Prisma, SubscriptionStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Assinaturas — Plataforma" };

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "secondary" | "warning" | "destructive" }> = {
  TRIALING: { label: "Trial", variant: "secondary" },
  ACTIVE: { label: "Ativa", variant: "success" },
  PAST_DUE: { label: "Pagamento pendente", variant: "warning" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
};

export default async function PlatformSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const where: Prisma.SubscriptionWhereInput = {};
  if (status) where.status = status as SubscriptionStatus;

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: { company: true, plan: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assinaturas</h1>

      <form className="flex flex-wrap gap-2">
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          <option value="TRIALING">Trial</option>
          <option value="ACTIVE">Ativa</option>
          <option value="PAST_DUE">Pagamento pendente</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm">Filtrar</button>
      </form>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Empresa</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Status</th>
              <th className="p-3">Período atual</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => {
              const st = STATUS_LABEL[s.status] ?? STATUS_LABEL.TRIALING;
              return (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{s.company.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {s.plan.name} ({s.plan.cycle === "SEMIANNUAL" ? "semestral" : "anual"})
                  </td>
                  <td className="p-3 text-muted-foreground">{formatCurrency(s.plan.priceCents / 100)}</td>
                  <td className="p-3">
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {s.currentPeriodStart ? formatDate(s.currentPeriodStart) : "—"} –{" "}
                    {s.currentPeriodEnd ? formatDate(s.currentPeriodEnd) : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/plataforma/empresas/${s.companyId}`} className="text-primary hover:underline">
                      Gerenciar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Nenhuma assinatura encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
