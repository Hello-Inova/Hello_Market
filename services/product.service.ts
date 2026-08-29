import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface CatalogFilters {
  q?: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  minRating?: number;
  sort?:
    | "relevance"
    | "best_sellers"
    | "newest"
    | "price_asc"
    | "price_desc"
    | "top_rated";
  page?: number;
  perPage?: number;
}

export async function searchProducts(filters: CatalogFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(60, filters.perPage ?? 24);

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
  };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { sku: { contains: filters.q, mode: "insensitive" } },
      { tags: { has: filters.q.toLowerCase() } },
      { brand: { name: { contains: filters.q, mode: "insensitive" } } },
      { category: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }

  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }
  if (filters.brandSlug) {
    where.brand = { slug: filters.brandSlug };
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) where.price.gte = filters.minPrice;
    if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
  }
  if (filters.inStockOnly) {
    where.stock = { gt: 0 };
  }
  if (filters.onSaleOnly) {
    where.compareAtPrice = { not: null };
  }
  if (filters.minRating) {
    where.avgRating = { gte: filters.minRating };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price_asc"
      ? { price: "asc" }
      : filters.sort === "price_desc"
      ? { price: "desc" }
      : filters.sort === "newest"
      ? { createdAt: "desc" }
      : filters.sort === "best_sellers"
      ? { soldCount: "desc" }
      : filters.sort === "top_rated"
      ? { avgRating: "desc" }
      : { featured: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        brand: true,
        category: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: { in: ["ACTIVE", "DRAFT"] } },
    include: {
      images: { orderBy: { order: "asc" } },
      variants: { where: { active: true }, include: { images: true } },
      category: true,
      brand: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (product) {
    // fire and forget view counter
    prisma.product
      .update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => null);
  }

  return product;
}

export async function getRelatedProducts(productId: string, categoryId: string | null, take = 8) {
  return prisma.product.findMany({
    where: {
      id: { not: productId },
      status: "ACTIVE",
      ...(categoryId ? { categoryId } : {}),
    },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { soldCount: "desc" },
    take,
  });
}

export async function recalculateProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    },
  });
}
