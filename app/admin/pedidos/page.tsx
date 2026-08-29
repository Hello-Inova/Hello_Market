import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/order-status";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Pedidos" };

const STATUS_OPTIONS = ["PENDING", "PAYMENT_PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pagina?: string }>;
}) {
  const { q, status, pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);
  const perPage = 20;

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as never;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { user: { fullName: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true, payments: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.order.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por pedido, cliente ou e-mail..." className="max-w-xs" />
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
        </select>
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm">Filtrar</button>
      </form>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Pedido</th><th className="p-3">Cliente</th><th className="p-3">Data</th>
              <th className="p-3">Pagamento</th><th className="p-3">Status</th><th className="p-3">Total</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{order.orderNumber}</td>
                <td className="p-3">{order.user.fullName}</td>
                <td className="p-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                <td className="p-3 text-muted-foreground">{order.payments[0]?.method ?? "—"}</td>
                <td className="p-3"><Badge variant={ORDER_STATUS_COLOR[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge></td>
                <td className="p-3 font-semibold">{formatCurrency(Number(order.total))}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/pedidos/${order.id}`} className="text-primary hover:underline">Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} pedido(s)</span>
        <div className="flex gap-2">
          {page > 1 && <Link href={`/admin/pedidos?pagina=${page - 1}`} className="text-primary hover:underline">Anterior</Link>}
          {page * perPage < total && <Link href={`/admin/pedidos?pagina=${page + 1}`} className="text-primary hover:underline">Próxima</Link>}
        </div>
      </div>
    </div>
  );
}
