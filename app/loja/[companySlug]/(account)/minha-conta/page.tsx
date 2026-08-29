import Link from "next/link";
import type { Metadata } from "next";
import { Package, MapPin, Heart, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountOverviewPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const base = `/loja/${companySlug}`;
  const user = await getCurrentUser();
  if (!user) return null;

  const [orderCount, addressCount, favoriteCount, reviewCount, recentOrders] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
  ]);

  const stats = [
    { label: "Pedidos", value: orderCount, icon: Package, href: `${base}/minha-conta/pedidos` },
    { label: "Endereços", value: addressCount, icon: MapPin, href: `${base}/minha-conta/enderecos` },
    { label: "Favoritos", value: favoriteCount, icon: Heart, href: `${base}/minha-conta/favoritos` },
    { label: "Avaliações", value: reviewCount, icon: Star, href: `${base}/minha-conta/avaliacoes` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Olá, {user.firstName}!</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <s.icon className="h-6 w-6 text-primary" />
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`${base}/minha-conta/pedidos/${order.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:text-primary"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} — {order.items.length} ite{order.items.length > 1 ? "ns" : "m"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{ORDER_STATUS_LABEL[order.status]}</Badge>
                    <span className="font-semibold">{formatCurrency(Number(order.total))}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
