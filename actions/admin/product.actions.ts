"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { productSchema } from "@/schemas/product.schema";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export interface ActionResult {
  success: boolean;
  message?: string;
  productId?: string;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let attempt = 0;
  for (;;) {
    const existing = await prisma.product.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined } });
    if (!existing) return slug;
    attempt += 1;
    slug = `${slugify(base)}-${attempt}`;
  }
}

export async function saveProductAction(productId: string | null, raw: unknown): Promise<ActionResult> {
  const admin = await requirePermission(productId ? "products.edit" : "products.create");

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  const slug = await uniqueSlug(data.slug || data.name, productId ?? undefined);

  const skuOwner = await prisma.product.findFirst({ where: { sku: data.sku, id: productId ? { not: productId } : undefined } });
  if (skuOwner) return { success: false, message: "Já existe um produto com este SKU." };

  const payload = {
    name: data.name,
    slug,
    sku: data.sku,
    shortDescription: data.shortDescription || null,
    description: data.description || null,
    price: data.price,
    compareAtPrice: data.compareAtPrice ?? null,
    costPrice: data.costPrice ?? null,
    stock: data.stock,
    minStock: data.minStock,
    weightKg: data.weightKg ?? null,
    heightCm: data.heightCm ?? null,
    widthCm: data.widthCm ?? null,
    lengthCm: data.lengthCm ?? null,
    categoryId: data.categoryId || null,
    brandId: data.brandId || null,
    tags: data.tags,
    status: data.status,
    featured: data.featured,
    type: data.type,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
  };

  const product = await prisma.$transaction(async (tx) => {
    const saved = productId
      ? await tx.product.update({ where: { id: productId }, data: payload })
      : await tx.product.create({ data: payload });

    await tx.productImage.deleteMany({ where: { productId: saved.id } });
    if (data.images.length > 0) {
      await tx.productImage.createMany({
        data: data.images.map((img, idx) => ({
          productId: saved.id,
          url: img.url,
          altText: img.altText || null,
          order: img.order ?? idx,
          variantId: img.variantId || null,
        })),
      });
    }

    const existingVariants = await tx.productVariant.findMany({ where: { productId: saved.id } });
    const incomingIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id));
    const toDelete = existingVariants.filter((v) => !incomingIds.has(v.id));
    if (toDelete.length > 0) {
      await tx.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });
    }

    for (const variant of data.variants) {
      if (variant.id) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            sku: variant.sku,
            name: variant.name,
            options: variant.options,
            price: variant.price ?? null,
            compareAtPrice: variant.compareAtPrice ?? null,
            stock: variant.stock,
            weightKg: variant.weightKg ?? null,
            imageUrl: variant.imageUrl || null,
            active: variant.active,
          },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId: saved.id,
            sku: variant.sku,
            name: variant.name,
            options: variant.options,
            price: variant.price ?? null,
            compareAtPrice: variant.compareAtPrice ?? null,
            stock: variant.stock,
            weightKg: variant.weightKg ?? null,
            imageUrl: variant.imageUrl || null,
            active: variant.active,
          },
        });
      }
    }

    return saved;
  });

  await logAudit({
    adminId: admin.id,
    action: productId ? "product.update" : "product.create",
    entity: "Product",
    entityId: product.id,
  });

  revalidatePath(`/admin/${admin.companySlug}/produtos`);
  revalidatePath(`/loja/${admin.companySlug}/produto/${slug}`);

  return { success: true, productId: product.id };
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const admin = await requirePermission("products.delete");
  await prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED" } });
  await logAudit({ adminId: admin.id, action: "product.archive", entity: "Product", entityId: productId });
  revalidatePath(`/admin/${admin.companySlug}/produtos`);
  return { success: true };
}

export async function duplicateProductAction(productId: string): Promise<ActionResult> {
  const admin = await requirePermission("products.create");
  const original = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { images: true, variants: true },
  });

  const slug = await uniqueSlug(`${original.name}-copia`);
  const sku = `${original.sku}-COPY-${Date.now().toString().slice(-5)}`;

  const copy = await prisma.product.create({
    data: {
      name: `${original.name} (cópia)`,
      slug,
      sku,
      shortDescription: original.shortDescription,
      description: original.description,
      price: original.price,
      compareAtPrice: original.compareAtPrice,
      costPrice: original.costPrice,
      stock: 0,
      minStock: original.minStock,
      weightKg: original.weightKg,
      heightCm: original.heightCm,
      widthCm: original.widthCm,
      lengthCm: original.lengthCm,
      categoryId: original.categoryId,
      brandId: original.brandId,
      tags: original.tags,
      status: "DRAFT",
      type: original.type,
      images: {
        create: original.images.map((img) => ({ url: img.url, altText: img.altText, order: img.order })),
      },
      variants: {
        create: original.variants.map((v) => ({
          sku: `${v.sku}-COPY-${Date.now().toString().slice(-5)}`,
          name: v.name,
          options: v.options as never,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: 0,
          weightKg: v.weightKg,
          imageUrl: v.imageUrl,
          active: v.active,
        })),
      },
    },
  });

  await logAudit({ adminId: admin.id, action: "product.duplicate", entity: "Product", entityId: copy.id });
  revalidatePath(`/admin/${admin.companySlug}/produtos`);

  return { success: true, productId: copy.id };
}

export async function toggleProductStatusAction(productId: string, status: "ACTIVE" | "INACTIVE"): Promise<ActionResult> {
  const admin = await requirePermission("products.edit");
  await prisma.product.update({ where: { id: productId }, data: { status } });
  await logAudit({ adminId: admin.id, action: "product.toggle_status", entity: "Product", entityId: productId, metadata: { status } });
  revalidatePath(`/admin/${admin.companySlug}/produtos`);
  return { success: true };
}

// Manual stock adjustments live in actions/admin/inventory.actions.ts
// (adjustProductStockAction), which also handles low-stock notifications.
