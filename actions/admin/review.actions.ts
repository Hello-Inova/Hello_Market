"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { logAudit } from "@/lib/audit";
import { recalculateProductRating } from "@/services/product.service";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function moderateReviewAction(reviewId: string, status: "APPROVED" | "REJECTED", moderationNote?: string): Promise<ActionResult> {
  const admin = await requirePermission("reviews.moderate");

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status, moderationNote },
  });

  // Recalculate on both APPROVED and REJECTED: the aggregate only ever
  // counts APPROVED reviews, so this correctly adds or removes this review
  // from the product's rating whichever direction the moderation went.
  await recalculateProductRating(review.productId);

  await logAudit({ adminId: admin.id, action: "review.moderate", entity: "Review", entityId: reviewId, metadata: { status } });
  revalidatePath(`/admin/${admin.companySlug}/avaliacoes`);

  return { success: true };
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult> {
  const admin = await requirePermission("reviews.moderate");
  const review = await prisma.review.delete({ where: { id: reviewId } });

  await recalculateProductRating(review.productId);

  await logAudit({ adminId: admin.id, action: "review.delete", entity: "Review", entityId: reviewId });
  revalidatePath(`/admin/${admin.companySlug}/avaliacoes`);

  return { success: true };
}
