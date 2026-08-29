import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CustomerDetailAdmin } from "@/components/admin/customer-detail-admin";

export const metadata: Metadata = { title: "Detalhe do cliente" };

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!customer) notFound();

  const totalSpent = customer.orders
    .filter((o) => !["CANCELLED"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <CustomerDetailAdmin
      customer={{
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        document: customer.document,
        birthDate: customer.birthDate ? customer.birthDate.toISOString() : null,
        blocked: customer.blocked,
        blockedReason: customer.blockedReason,
        marketingOptIn: customer.marketingOptIn,
        createdAt: customer.createdAt.toISOString(),
        addresses: customer.addresses.map((a) => ({
          id: a.id,
          label: a.label,
          street: a.street,
          number: a.number,
          neighborhood: a.neighborhood,
          city: a.city,
          state: a.state,
          zipCode: a.zipCode,
          isDefault: a.isDefault,
        })),
        orders: customer.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
        })),
        stats: {
          totalSpent,
          orderCount: customer.orders.length,
        },
      }}
    />
  );
}
