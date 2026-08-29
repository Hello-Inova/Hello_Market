import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { searchProducts } from "@/services/product.service";
import { ProductCard } from "@/components/storefront/product-card";
import { CatalogFiltersSidebar } from "@/components/storefront/catalog-filters";
import { CatalogSort } from "@/components/storefront/catalog-sort";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

export const metadata: Metadata = { title: "Produtos" };

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ companySlug: string }>;
  searchParams: Promise<SP>;
}) {
  const { companySlug } = await params;
  const base = `/loja/${companySlug}`;
  const sp = await searchParams;

  const filters = {
    q: first(sp.q),
    categorySlug: first(sp.categoria),
    brandSlug: first(sp.marca),
    minPrice: sp.min ? Number(first(sp.min)) : undefined,
    maxPrice: sp.max ? Number(first(sp.max)) : undefined,
    inStockOnly: sp.disponivel === "1",
    onSaleOnly: sp.promocao === "1",
    minRating: sp.avaliacao ? Number(first(sp.avaliacao)) : undefined,
    sort: (first(sp.ordenar) as never) || "relevance",
    page: sp.pagina ? Number(first(sp.pagina)) : 1,
  };

  const [{ items, total, page, totalPages }, categories, brands] = await Promise.all([
    searchProducts(filters),
    prisma.category.findMany({ where: { status: true }, orderBy: { order: "asc" } }),
    prisma.brand.findMany({ where: { status: true }, orderBy: { name: "asc" } }),
  ]);

  const activeCategory = categories.find((c) => c.slug === filters.categorySlug);

  return (
    <div className="container-page py-6">
      <h1 className="mb-1 text-2xl font-bold">
        {activeCategory ? activeCategory.name : filters.q ? `Resultados para "${filters.q}"` : "Todos os produtos"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">{total} produto(s) encontrado(s)</p>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="hidden md:block">
          <CatalogFiltersSidebar categories={categories} brands={brands} searchParams={sp} />
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <details className="md:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <SlidersHorizontal className="h-4 w-4" /> Filtros
              </summary>
              <div className="mt-3">
                <CatalogFiltersSidebar categories={categories} brands={brands} searchParams={sp} />
              </div>
            </details>
            <div className="ml-auto">
              <CatalogSort />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              Nenhum produto encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard
                  key={p.id}
                  basePath={base}
                  product={{
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    price: p.price as unknown as number,
                    compareAtPrice: p.compareAtPrice as unknown as number | null,
                    stock: p.stock,
                    avgRating: p.avgRating as unknown as number,
                    reviewCount: p.reviewCount,
                    images: p.images,
                  }}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1} asChild={page > 1}>
                {page > 1 ? (
                  <Link href={buildPageHref(base, sp, page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm">
                Página {page} de {totalPages}
              </span>
              <Button variant="outline" size="icon" disabled={page >= totalPages} asChild={page < totalPages}>
                {page < totalPages ? (
                  <Link href={buildPageHref(base, sp, page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPageHref(base: string, sp: SP, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "pagina") continue;
    if (typeof value === "string") params.set(key, value);
  }
  params.set("pagina", String(page));
  return `${base}/produtos?${params.toString()}`;
}
