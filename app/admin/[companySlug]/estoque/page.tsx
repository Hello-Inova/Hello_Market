import type { Metadata } from "next";
import { AlertTriangle, PackageX, Boxes, DollarSign } from "lucide-react";
import { prisma } from "@/lib/db";
import { getStockSummary } from "@/services/inventory.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StockAdjustDialog } from "@/components/admin/stock-adjust-dialog";
import { formatCurrency } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Estoque" };

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string }>;
}) {
  const { q, filtro } = await searchParams;
  const summary = await getStockSummary();

  const where: Prisma.ProductWhereInput = {};
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }];
  if (filtro === "low") where.stock = { gt: 0, lte: 5 };
  if (filtro === "out") where.stock = 0;

  const products = await prisma.product.findMany({
    where,
    include: { variants: true },
    orderBy: { stock: "asc" },
    take: 100,
  });

  const cards = [
    { label: "Produtos ativos com estoque", value: summary.activeWithStock, icon: Boxes },
    { label: "Sem estoque", value: summary.outOfStock, icon: PackageX },
    { label: "Abaixo do mínimo", value: summary.belowMinimumCount, icon: AlertTriangle },
    { label: "Valor estimado em estoque", value: formatCurrency(summary.estimatedValue), icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estoque</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <Card>
        <CardHeader><CardTitle>Produtos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap gap-2">
            <Input name="q" defaultValue={q} placeholder="Buscar por nome ou SKU..." className="max-w-xs" />
            <select name="filtro" defaultValue={filtro ?? ""} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">Todos</option>
              <option value="low">Estoque baixo</option>
              <option value="out">Sem estoque</option>
            </select>
            <button type="submit" className="rounded-lg border px-3 py-2 text-sm">Filtrar</button>
          </form>

          <div className="table-scroll rounded-xl border">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
                  <th className="p-3">Produto</th><th className="p-3">SKU</th><th className="p-3">Estoque</th>
                  <th className="p-3">Mínimo</th><th className="p-3">Status</th><th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isOut = p.stock === 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-muted-foreground">{p.sku}</td>
                      <td className="p-3 font-semibold">{p.stock}</td>
                      <td className="p-3 text-muted-foreground">{p.minStock}</td>
                      <td className="p-3">
                        <Badge variant={isOut ? "destructive" : isLow ? "warning" : "success"}>
                          {isOut ? "Sem estoque" : isLow ? "Estoque baixo" : "OK"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <StockAdjustDialog
                          productId={p.id}
                          productName={p.name}
                          stock={p.stock}
                          variants={p.variants.map((v) => ({ id: v.id, name: v.name, stock: v.stock }))}
                        />
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
