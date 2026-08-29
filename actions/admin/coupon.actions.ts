"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { couponSchema } from "@/schemas/admin.schema";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function saveCouponAction(couponId: string | null, raw: unknown): Promise<ActionResult> {
  const admin = await requirePermission("coupons.manage");
  const parsed = couponSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const data = parsed.data;
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing && existing.id !== couponId) {
    return { success: false, message: "Já existe um cupom com esse código." };
  }

  const payload = {
    code: data.code,
    description: data.description || null,
    type: data.type,
    value: data.value,
    minOrderValue: data.minOrderValue ?? null,
    maxDiscountValue: data.maxDiscountValue ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
    usageLimit: data.usageLimit ?? null,
    usageLimitPerUser: data.usageLimitPerUser,
    allowedCategoryIds: data.allowedCategoryIds,
    allowedProductIds: data.allowedProductIds,
    status: data.status,
  };

  if (couponId) {
    await prisma.coupon.update({ where: { id: couponId }, data: payload });
  } else {
    await prisma.coupon.create({ data: payload });
  }

  await logAudit({ adminId: admin.id, action: couponId ? "coupon.update" : "coupon.create", entity: "Coupon", entityId: couponId ?? undefined });
  revalidatePath(`/admin/${admin.companySlug}/cupons`);

  return { success: true };
}

export async function deleteCouponAction(couponId: string): Promise<ActionResult> {
  const admin = await requirePermission("coupons.manage");
  const usageCount = await prisma.couponUsage.count({ where: { couponId } });
  if (usageCount > 0) {
    await prisma.coupon.update({ where: { id: couponId }, data: { status: "INACTIVE" } });
    await logAudit({ adminId: admin.id, action: "coupon.deactivate", entity: "Coupon", entityId: couponId });
    revalidatePath(`/admin/${admin.companySlug}/cupons`);
    return { success: true, message: "Cupom já utilizado: foi desativado em vez de excluído." };
  }
  await prisma.coupon.delete({ where: { id: couponId } });
  await logAudit({ adminId: admin.id, action: "coupon.delete", entity: "Coupon", entityId: couponId });
  revalidatePath(`/admin/${admin.companySlug}/cupons`);
  return { success: true };
}
