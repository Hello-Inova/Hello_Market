"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { reviewSchema } from "@/schemas/review.schema";
import { createNotification } from "@/services/notification.service";
import { logAudit } from "@/lib/audit";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function submitReviewAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = reviewSchema.safeParse({
    ...raw,
    rating: Number(raw.rating),
    images: raw.images ? JSON.parse(String(raw.images)) : [],
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  // Only customers who purchased (and received) the product may review it (section 28).
  if (parsed.data.orderId) {
    const orderItem = await prisma.orderItem.findFirst({
      where: { orderId: parsed.data.orderId, productId: parsed.data.productId },
    });
    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, userId: user.id, status: "DELIVERED" },
    });
    if (!orderItem || !order) {
      return { success: false, message: "Você só pode avaliar produtos de pedidos entregues." };
    }
  } else {
    const purchased = await prisma.orderItem.findFirst({
      where: { productId: parsed.data.productId, order: { userId: user.id, status: "DELIVERED" } },
    });
    if (!purchased) {
      return { success: false, message: "Você só pode avaliar produtos que comprou e recebeu." };
    }
  }

  await prisma.review.upsert({
    where: {
      productId_userId_orderId: {
        productId: parsed.data.productId,
        userId: user.id,
        orderId: parsed.data.orderId ?? null,
      },
    },
    update: {
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      comment: parsed.data.comment || null,
      images: parsed.data.images,
      status: "PENDING",
    },
    create: {
      productId: parsed.data.productId,
      userId: user.id,
      orderId: parsed.data.orderId ?? null,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      comment: parsed.data.comment || null,
      images: parsed.data.images,
    },
  });

  await createNotification({
    type: "NEW_REVIEW",
    title: "Nova avaliação",
    message: `Nova avaliação recebida para moderação`,
    link: "/admin/avaliacoes",
  });

  await logAudit({ userId: user.id, action: "review.submit", entity: "Product", entityId: parsed.data.productId });

  revalidatePath("/minha-conta/avaliacoes");

  return { success: true, message: "Avaliação enviada! Ela será publicada após moderação." };
}

// Moderation (approve/reject/delete) is an admin-only operation — see
// actions/admin/review.actions.ts, which enforces requirePermission("reviews.moderate").
// It intentionally does not live here: this file has no admin auth gate, and
// every export of a "use server" module is a directly-callable endpoint.
