import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/order-status";

export const metadata: Metadata = { title: "Meus pedidos" };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { take: 1 } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Meus pedidos</h1>
      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Você ainda não fez nenhum pedido.
        </div>
      ) : (
        <div className="table-scroll">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2">Pedido</th>
                <th className="py-2">Data</th>
                <th className="py-2">Status</th>
                <th className="py-2">Total</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-3 font-medium">{order.orderNumber}</td>
                  <td className="py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  <td className="py-3">
                    <Badge variant={ORDER_STATUS_COLOR[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                  </td>
                  <td className="py-3 font-semibold">{formatCurrency(Number(order.total))}</td>
                  <td className="py-3 text-right">
                    <Link href={`/minha-conta/pedidos/${order.id}`} className="text-primary hover:underline">
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
