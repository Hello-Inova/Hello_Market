import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { DEFAULT_COMPANY_SLUG } from "@/lib/tenant/resolve";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const STORE_BASE = `${APP_URL}/loja/${DEFAULT_COMPANY_SLUG}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.category.findMany({
      where: { status: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: STORE_BASE, changeFrequency: "daily", priority: 1 },
    { url: `${STORE_BASE}/produtos`, changeFrequency: "hourly", priority: 0.9 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${STORE_BASE}/produto/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${STORE_BASE}/produtos?categoria=${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${STORE_BASE}/paginas/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.3,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...pageRoutes];
}
