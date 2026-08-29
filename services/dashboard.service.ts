import "server-only";
import { prisma } from "@/lib/db";
import { subDays, startOfDay } from "date-fns";

export type DateRangeKey = "today" | "7d" | "30d" | "90d" | "year";

export function rangeToDate(range: DateRangeKey): Date {
  const now = new Date();
  switch (range) {
    case "today":
      return startOfDay(now);
    case "7d":
      return subDays(now, 7);
    case "30d":
      return subDays(now, 30);
    case "90d":
      return subDays(now, 90);
    case "year":
      return subDays(now, 365);
  }
}

export async function getDashboardStats(range: DateRangeKey) {
  const since = rangeToDate(range);

  const paidStatuses = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

  const [revenueAgg, orderCount, newCustomers, lowStockCount, pendingPayments, topProducts, dailySales] =
    await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: since }, status: { in: [...paidStatuses] } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.product.count({ where: { status: "ACTIVE", stock: { gt: 0 } } }),
      prisma.order.count({ where: { status: "PAYMENT_PENDING" } }),
      prisma.orderItem.groupBy({
        by: ["productName"],
        where: { order: { createdAt: { gte: since }, status: { in: [...paidStatuses] } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.$queryRaw<{ day: string; total: string }[]>`
        SELECT to_char("createdAt", 'YYYY-MM-DD') as day, COALESCE(SUM(total), 0)::text as total
        FROM "Order"
        WHERE "createdAt" >= ${since} AND status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
        GROUP BY day ORDER BY day ASC
      `,
    ]);

  const revenue = Number(revenueAgg._sum.total ?? 0);
  const paidOrderCount = revenueAgg._count;

  return {
    revenue,
    orderCount,
    avgTicket: paidOrderCount > 0 ? revenue / paidOrderCount : 0,
    newCustomers,
    lowStockCount,
    pendingPayments,
    topProducts: topProducts.map((p) => ({ name: p.productName, quantity: p._sum.quantity ?? 0 })),
    dailySales: dailySales.map((d) => ({ day: d.day, total: parseFloat(d.total) })),
  };
}
