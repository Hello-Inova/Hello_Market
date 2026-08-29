"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { addressSchema } from "@/schemas/address.schema";
import { logAudit } from "@/lib/audit";

export interface ActionResult {
  success: boolean;
  message?: string;
  addressId?: string;
}

export async function createAddressAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = addressSchema.safeParse({
    ...raw,
    isDefault: raw.isDefault === "on" || raw.isDefault === "true",
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const count = await prisma.address.count({ where: { userId: user.id } });

  if (parsed.data.isDefault || count === 0) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: { ...parsed.data, userId: user.id, isDefault: parsed.data.isDefault || count === 0 },
  });

  await logAudit({ userId: user.id, action: "address.create", entity: "Address", entityId: address.id });
  revalidatePath("/minha-conta/enderecos");
  revalidatePath("/checkout");

  return { success: true, addressId: address.id };
}

export async function updateAddressAction(addressId: string, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = addressSchema.safeParse({
    ...raw,
    isDefault: raw.isDefault === "on" || raw.isDefault === "true",
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
  if (!existing) return { success: false, message: "Endereço não encontrado." };

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  await prisma.address.update({ where: { id: addressId }, data: parsed.data });
  await logAudit({ userId: user.id, action: "address.update", entity: "Address", entityId: addressId });
  revalidatePath("/minha-conta/enderecos");

  return { success: true, addressId };
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  await prisma.address.deleteMany({ where: { id: addressId, userId: user.id } });
  await logAudit({ userId: user.id, action: "address.delete", entity: "Address", entityId: addressId });
  revalidatePath("/minha-conta/enderecos");

  return { success: true };
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Não autenticado." };

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.updateMany({ where: { id: addressId, userId: user.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/minha-conta/enderecos");

  return { success: true };
}
