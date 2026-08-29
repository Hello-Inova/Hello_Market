import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { OrderDetailAdmin } from "@/components/admin/order-detail-admin";

export const metadata: Metadata = { title: "Detalhe do pedido" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      cancellationRequests: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  return (
    <OrderDetailAdmin
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        carrier: order.carrier,
        trackingCode: order.trackingCode,
        trackingUrl: order.trackingUrl,
        internalNote: order.internalNote,
        customerNote: order.customerNote,
        createdAt: order.createdAt.toISOString(),
        addressSnapshot: order.addressSnapshot as never,
        customer: {
          fullName: order.user.fullName,
          email: order.user.email,
          phone: order.user.phone,
        },
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          totalPrice: Number(item.totalPrice),
        })),
        payments: order.payments.map((p) => ({
          id: p.id,
          method: p.method,
          status: p.status,
          amount: Number(p.amount),
          installments: p.installments,
        })),
        statusHistory: order.statusHistory.map((h) => ({
          status: h.status,
          note: h.note,
          createdAt: h.createdAt.toISOString(),
        })),
        cancellationRequests: order.cancellationRequests.map((r) => ({
          id: r.id,
          reason: r.reason,
          note: r.note,
          status: r.status,
        })),
      }}
    />
  );
}
