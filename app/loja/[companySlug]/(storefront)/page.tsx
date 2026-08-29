import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/storefront/product-card";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

async function getHomeData() {
  const [banners, featured, bestSellers, newArrivals, onSale, categories, brands] = await Promise.all([
    prisma.banner.findMany({
      where: {
        active: true,
        position: "home_hero",
        OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
      },
      orderBy: { order: "asc" },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", featured: true },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      take: 8,
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      orderBy: { soldCount: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", compareAtPrice: { not: null } },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      take: 8,
    }),
    prisma.category.findMany({ where: { status: true, parentId: null }, orderBy: { order: "asc" }, take: 8 }),
    prisma.brand.findMany({ where: { status: true }, take: 10 }),
  ]);

  return { banners, featured, bestSellers, newArrivals, onSale, categories, brands };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const base = `/loja/${companySlug}`;
  const { banners, featured, bestSellers, newArrivals, onSale, categories, brands } = await getHomeData();

  return (
    <div className="pb-16">
      {/* Hero banners */}
      {banners.length > 0 && (
        <section className="container-page pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {banners.slice(0, 2).map((banner, idx) => (
              <Link
                key={banner.id}
                href={banner.link || "#"}
                className={`relative block overflow-hidden rounded-2xl bg-secondary ${idx === 0 ? "sm:col-span-2 aspect-[21/9]" : "aspect-[16/9]"}`}
              >
                <Image
                  src={banner.imageUrlDesktop}
                  alt={banner.title}
                  fill
                  priority={idx === 0}
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-t from-black/60 via-black/0 p-6 text-white">
                  <h2 className="text-2xl font-bold sm:text-3xl">{banner.title}</h2>
                  {banner.subtitle && <p className="max-w-md text-sm sm:text-base">{banner.subtitle}</p>}
                  {banner.buttonText && (
                    <span className="mt-2 inline-block w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground">
                      {banner.buttonText}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-page mt-10">
          <h2 className="mb-4 text-xl font-bold">Categorias</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`${base}/produtos?categoria=${c.slug}`}
                className="group flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors hover:border-primary"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-secondary">
                  {c.imageUrl && (
                    <Image src={c.imageUrl} alt={c.name} fill className="object-cover" sizes="56px" />
                  )}
                </div>
                <span className="text-xs font-medium group-hover:text-primary">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <ProductSection title="Destaques" products={featured} viewAllHref={`${base}/produtos?destaque=1`} basePath={base} />
      )}

      {onSale.length > 0 && (
        <ProductSection title="Ofertas" products={onSale} viewAllHref={`${base}/produtos?promocao=1`} badge="OFERTA" basePath={base} />
      )}

      {bestSellers.length > 0 && (
        <ProductSection title="Mais vendidos" products={bestSellers} viewAllHref={`${base}/produtos?ordenar=mais_vendidos`} basePath={base} />
      )}

      {newArrivals.length > 0 && (
        <ProductSection title="Novidades" products={newArrivals} viewAllHref={`${base}/produtos?ordenar=recentes`} basePath={base} />
      )}

      {brands.length > 0 && (
        <section className="container-page mt-10">
          <h2 className="mb-4 text-xl font-bold">Marcas</h2>
          <div className="flex flex-wrap gap-4">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`${base}/produtos?marca=${b.slug}`}
                className="flex h-16 w-32 items-center justify-center rounded-lg border bg-white p-3 grayscale transition hover:grayscale-0"
              >
                {b.logoUrl ? (
                  <Image src={b.logoUrl} alt={b.name} width={100} height={40} className="max-h-10 w-auto object-contain" />
                ) : (
                  <span className="text-sm font-semibold">{b.name}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-page mt-14">
        <div className="rounded-2xl bg-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">Receba nossas ofertas em primeira mão</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre seu e-mail e receba cupons exclusivos.</p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}

function ProductSection({
  title,
  products,
  viewAllHref,
  badge,
  basePath,
}: {
  title: string;
  products: Awaited<ReturnType<typeof getHomeData>>["featured"];
  viewAllHref: string;
  badge?: string;
  basePath: string;
}) {
  return (
    <section className="container-page mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          {title}
          {badge && <Badge variant="destructive">{badge}</Badge>}
        </h2>
        <Link href={viewAllHref} className="text-sm font-medium text-primary hover:underline">
          Ver tudo
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            basePath={basePath}
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
    </section>
  );
}
