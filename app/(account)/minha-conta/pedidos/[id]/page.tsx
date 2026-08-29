import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OrderDetail } from "@/components/account/order-detail";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: true,
    },
  });

  if (!order) notFound();

  const reviews = await prisma.review.findMany({
    where: { orderId: order.id, userId: user.id },
  });
  const reviewedProductIds = new Set(reviews.map((r) => r.productId));

  return (
    <OrderDetail
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        trackingCode: order.trackingCode,
        trackingUrl: order.trackingUrl,
        carrier: order.carrier,
        createdAt: order.createdAt.toISOString(),
        addressSnapshot: order.addressSnapshot as never,
        canCancel: ["PENDING", "PAYMENT_PENDING", "PAID", "PROCESSING"].includes(order.status),
        canReview: order.status === "DELIVERED",
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          variantName: item.variantName,
          imageUrl: item.imageUrl,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          totalPrice: Number(item.totalPrice),
          hasReview: reviewedProductIds.has(item.productId),
        })),
      }}
    />
  );
}
