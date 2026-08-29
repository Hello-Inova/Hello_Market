import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Editar produto" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } }, variants: true },
    }),
    prisma.category.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar produto</h1>
      <ProductForm
        categories={categories}
        brands={brands}
        product={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          costPrice: product.costPrice ? Number(product.costPrice) : null,
          stock: product.stock,
          minStock: product.minStock,
          weightKg: product.weightKg ? Number(product.weightKg) : null,
          heightCm: product.heightCm ? Number(product.heightCm) : null,
          widthCm: product.widthCm ? Number(product.widthCm) : null,
          lengthCm: product.lengthCm ? Number(product.lengthCm) : null,
          categoryId: product.categoryId,
          brandId: product.brandId,
          tags: product.tags,
          status: product.status,
          featured: product.featured,
          type: product.type,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          images: product.images.map((img) => ({ id: img.id, url: img.url, altText: img.altText ?? "" })),
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            optionsText: Object.entries(v.options as Record<string, string>)
              .map(([k, val]) => `${k}:${val}`)
              .join(", "),
            price: v.price ? String(v.price) : "",
            stock: String(v.stock),
            imageUrl: v.imageUrl ?? "",
            active: v.active,
          })),
        }}
      />
    </div>
  );
}
