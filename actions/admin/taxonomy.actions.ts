"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { categorySchema, brandSchema } from "@/schemas/product.schema";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export interface ActionResult {
  success: boolean;
  message?: string;
}

export async function saveCategoryAction(categoryId: string | null, raw: unknown): Promise<ActionResult> {
  const admin = await requirePermission("products.edit");
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const slug = slugify(parsed.data.slug || parsed.data.name);
  const data = { ...parsed.data, slug };

  if (categoryId) {
    await prisma.category.update({ where: { id: categoryId }, data });
  } else {
    await prisma.category.create({ data });
  }

  await logAudit({ adminId: admin.id, action: categoryId ? "category.update" : "category.create", entity: "Category" });
  revalidatePath("/admin/categorias");
  revalidatePath("/produtos");
  return { success: true };
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  const admin = await requirePermission("products.delete");
  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    return { success: false, message: `Não é possível excluir: ${productCount} produto(s) usam esta categoria.` };
  }
  await prisma.category.delete({ where: { id: categoryId } });
  await logAudit({ adminId: admin.id, action: "category.delete", entity: "Category", entityId: categoryId });
  revalidatePath("/admin/categorias");
  return { success: true };
}

export async function saveBrandAction(brandId: string | null, raw: unknown): Promise<ActionResult> {
  const admin = await requirePermission("products.edit");
  const parsed = brandSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const slug = slugify(parsed.data.slug || parsed.data.name);
  const data = { ...parsed.data, slug };

  if (brandId) {
    await prisma.brand.update({ where: { id: brandId }, data });
  } else {
    await prisma.brand.create({ data });
  }

  await logAudit({ adminId: admin.id, action: brandId ? "brand.update" : "brand.create", entity: "Brand" });
  revalidatePath("/admin/marcas");
  return { success: true };
}

export async function deleteBrandAction(brandId: string): Promise<ActionResult> {
  const admin = await requirePermission("products.delete");
  const productCount = await prisma.product.count({ where: { brandId } });
  if (productCount > 0) {
    return { success: false, message: `Não é possível excluir: ${productCount} produto(s) usam esta marca.` };
  }
  await prisma.brand.delete({ where: { id: brandId } });
  await logAudit({ adminId: admin.id, action: "brand.delete", entity: "Brand", entityId: brandId });
  revalidatePath("/admin/marcas");
  return { success: true };
}
