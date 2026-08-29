import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CouponManager } from "@/components/admin/coupon-manager";

export const metadata: Metadata = { title: "Cupons" };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cupons</h1>
      <CouponManager
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          description: c.description,
          type: c.type,
          value: Number(c.value),
          minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
          maxDiscountValue: c.maxDiscountValue ? Number(c.maxDiscountValue) : null,
          startsAt: c.startsAt ? c.startsAt.toISOString() : null,
          endsAt: c.endsAt ? c.endsAt.toISOString() : null,
          usageLimit: c.usageLimit,
          usageLimitPerUser: c.usageLimitPerUser ?? 1,
          usedCount: c.usedCount,
          status: c.status,
        }))}
      />
    </div>
  );
}
