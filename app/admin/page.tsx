import type { Metadata } from "next";
import Link from "next/link";
import { DollarSign, ShoppingBag, TrendingUp, Users, AlertTriangle, Clock } from "lucide-react";
import { getDashboardStats, type DateRangeKey } from "@/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesChart } from "@/components/admin/sales-chart";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const RANGES: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "year", label: "Ano" },
];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const range = (RANGES.find((r) => r.key === periodo)?.key ?? "30d") as DateRangeKey;
  const stats = await getDashboardStats(range);

  const cards = [
    { label: "Faturamento", value: formatCurrency(stats.revenue), icon: DollarSign },
    { label: "Pedidos", value: stats.orderCount, icon: ShoppingBag },
    { label: "Ticket médio", value: formatCurrency(stats.avgTicket), icon: TrendingUp },
    { label: "Novos clientes", value: stats.newCustomers, icon: Users },
    { label: "Estoque baixo", value: stats.lowStockCount, icon: AlertTriangle },
    { label: "Pagamentos pendentes", value: stats.pendingPayments, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-1 rounded-lg border bg-white p-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin?periodo=${r.key}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                range === r.key ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <c.icon className="mb-2 h-5 w-5 text-primary" />
              <div className="text-xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Vendas no período</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={stats.dailySales} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mais vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
            ) : (
              <ul className="space-y-3">
                {stats.topProducts.map((p, idx) => (
                  <li key={p.name} className="flex items-center justify-between text-sm">
                    <span className="truncate">{idx + 1}. {p.name}</span>
                    <span className="font-semibold">{p.quantity}un</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
