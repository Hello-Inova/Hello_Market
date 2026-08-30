import type { Metadata } from "next";
import Link from "next/link";
import { Building2, TrendingUp, Clock, AlertTriangle, Ban } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — Plataforma" };

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "secondary" | "warning" | "destructive" }> = {
  TRIAL: { label: "Trial", variant: "secondary" },
  ACTIVE: { label: "Ativa", variant: "success" },
  PAST_DUE: { label: "Pagamento pendente", variant: "warning" },
  SUSPENDED: { label: "Suspensa", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
};

// Converte o ciclo de cobrança para um valor mensal equivalente, para poder
// somar planos semestrais e anuais numa única métrica de MRR comparável.
function monthlyEquivalentCents(priceCents: number, cycle: "SEMIANNUAL" | "ANNUAL") {
  return cycle === "SEMIANNUAL" ? priceCents / 6 : priceCents / 12;
}

async function getDashboardData() {
  const [byStatus, totalCompanies, activeSubscriptions, recentCompanies] = await Promise.all([
    prisma.company.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.company.count(),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    }),
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { subscription: { include: { plan: true } } },
    }),
  ]);

  const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
  const mrrCents = activeSubscriptions.reduce(
    (sum, sub) => sum + monthlyEquivalentCents(sub.plan.priceCents, sub.plan.cycle),
    0
  );

  return {
    totalCompanies,
    trialCount: statusCounts.TRIAL ?? 0,
    activeCount: statusCounts.ACTIVE ?? 0,
    pastDueCount: statusCounts.PAST_DUE ?? 0,
    suspendedCount: (statusCounts.SUSPENDED ?? 0) + (statusCounts.CANCELLED ?? 0),
    mrrCents,
    recentCompanies,
  };
}

export default async function PlatformDashboardPage() {
  const data = await getDashboardData();
  const mrr = (data.mrrCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral de todas as empresas na plataforma Hello Inova.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={Building2} label="Empresas" value={data.totalCompanies} />
        <StatCard icon={TrendingUp} label="MRR estimado" value={mrr} />
        <StatCard icon={Clock} label="Em trial" value={data.trialCount} />
        <StatCard icon={AlertTriangle} label="Pagamento pendente" value={data.pastDueCount} />
        <StatCard icon={Ban} label="Suspensas/canceladas" value={data.suspendedCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-scroll">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Plano</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Cadastro</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {data.recentCompanies.map((c) => {
                  const status = STATUS_LABEL[c.status] ?? STATUS_LABEL.TRIAL;
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="p-3">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">/{c.slug}</p>
                      </td>
                      <td className="p-3 text-muted-foreground">{c.subscription?.plan.name ?? "—"}</td>
                      <td className="p-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                      <td className="p-3 text-right">
                        <Link href={`/plataforma/empresas/${c.id}`} className="text-primary hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {data.recentCompanies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Nenhuma empresa cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-xl font-bold leading-tight sm:text-2xl">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
