"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function joinWaitlistAction(productId: string, email?: string) {
  const user = await getCurrentUser();
  const targetEmail = user?.email ?? email;
  if (!targetEmail) return { success: false, message: "Informe um e-mail." };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, message: "Produto não encontrado." };

  if (!product.notifyWaitlist.includes(targetEmail)) {
    await prisma.product.update({
      where: { id: productId },
      data: { notifyWaitlist: { push: targetEmail } },
    });
  }

  return { success: true, message: "Você será avisado quando o produto chegar!" };
}
