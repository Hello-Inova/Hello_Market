import Link from "next/link";
import Image from "next/image";
import { CreditCard, ShieldCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/storefront/product-card";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const BENEFITS = [
  { icon: Truck, title: "Entrega acompanhada", copy: "Você sabe onde seu pedido está." },
  { icon: ShieldCheck, title: "Compra protegida", copy: "Transparência em cada etapa." },
  { icon: CreditCard, title: "Pagamento flexível", copy: "Escolha a condição ideal para você." },
];

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
      <div className="container-page pt-6 md:pt-8">
        {/* Hero: usa os banners cadastrados quando existirem; sem nenhum
            banner ativo, mostra uma vitrine de abertura genérica em vez de
            uma seção vazia — a loja nunca fica "sem cara" antes de a
            empresa configurar seus banners. */}
        {banners.length > 0 ? (
          <section className="grid gap-4 sm:grid-cols-2">
            {banners.slice(0, 2).map((banner, idx) => (
              <Link
                key={banner.id}
                href={banner.link || "#"}
                className={`group relative block overflow-hidden rounded-3xl bg-neutral-950 ${idx === 0 ? "sm:col-span-2 aspect-[21/9]" : "aspect-[16/9]"}`}
              >
                <Image
                  src={banner.imageUrlDesktop}
                  alt={banner.title}
                  fill
                  priority={idx === 0}
                  className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                  sizes="100vw"
                />
                <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-t from-black/70 via-black/10 p-6 text-white md:p-10">
                  <h2 className="font-serif text-2xl font-bold leading-tight sm:text-3xl">{banner.title}</h2>
                  {banner.subtitle && <p className="max-w-md text-sm text-white/80 sm:text-base">{banner.subtitle}</p>}
                  {banner.buttonText && (
                    <span className="mt-2 inline-block w-fit rounded-lg bg-white px-4 py-2 text-sm font-bold text-black">
                      {banner.buttonText}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="relative isolate overflow-hidden rounded-3xl bg-neutral-950 py-14 text-white sm:py-20">
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full border border-white/15" />
            <div className="relative max-w-lg px-6 sm:px-12">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/60">Escolhas bem feitas</p>
              <h1 className="mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl">
                Uma forma mais simples de encontrar o que importa.
              </h1>
              <p className="mt-5 max-w-md text-white/75">
                Produtos selecionados para a sua rotina, em uma experiência de compra leve, direta e confiável.
              </p>
              <Button asChild size="lg" className="mt-8 rounded-lg bg-white text-black hover:bg-white/90">
                <Link href="#produtos-em-destaque">Ver seleção</Link>
              </Button>
            </div>
          </section>
        )}

        {/* Faixa de confiança */}
        <section className="mt-5 grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className={`flex items-center gap-3 px-6 py-5 ${i > 0 ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}
            >
              <b.icon className="h-5 w-5 shrink-0 text-foreground" />
              <div>
                <p className="text-sm font-bold text-foreground">{b.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{b.copy}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Categorias */}
      {categories.length > 0 && (
        <section className="container-page mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Navegue por</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-foreground">Categorias</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`${base}/produtos?categoria=${c.slug}`}
                className="group flex w-[calc(33.333%-8px)] flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-foreground sm:w-[calc(25%-9px)] md:w-[calc(12.5%-10.5px)]"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-secondary">
                  {c.imageUrl && (
                    <Image src={c.imageUrl} alt={c.name} fill className="object-cover" sizes="56px" />
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div id="produtos-em-destaque" />

      {featured.length > 0 && (
        <ProductSection title="Destaques" products={featured} viewAllHref={`${base}/produtos?destaque=1`} basePath={base} />
      )}

      {onSale.length > 0 && (
        <>
          <ProductSection title="Ofertas" products={onSale.slice(0, 4)} viewAllHref={`${base}/produtos?promocao=1`} badge="OFERTA" basePath={base} />
          <section className="container-page mt-10">
            <div className="relative overflow-hidden rounded-3xl bg-secondary">
              <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full border-[32px] border-black/[0.06]" />
              <div className="relative max-w-xl px-6 py-10 sm:px-12">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Seleção da semana</p>
                <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-foreground">
                  Ofertas para levar apenas o essencial.
                </h2>
                <p className="mt-4 max-w-md text-muted-foreground">
                  Descontos pontuais em produtos que combinam funcionalidade, presença e bom design.
                </p>
                <Button asChild variant="outline" className="mt-6 rounded-lg bg-card">
                  <Link href={`${base}/produtos?promocao=1`}>Explorar ofertas</Link>
                </Button>
              </div>
            </div>
          </section>
        </>
      )}

      {bestSellers.length > 0 && (
        <ProductSection title="Mais vendidos" products={bestSellers} viewAllHref={`${base}/produtos?ordenar=mais_vendidos`} basePath={base} />
      )}

      {newArrivals.length > 0 && (
        <ProductSection title="Novidades" products={newArrivals} viewAllHref={`${base}/produtos?ordenar=recentes`} basePath={base} />
      )}

      {brands.length > 0 && (
        <section className="container-page mt-10">
          <h2 className="mb-4 font-serif text-xl font-bold text-foreground">Marcas</h2>
          <div className="flex flex-wrap gap-4">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`${base}/produtos?marca=${b.slug}`}
                className="flex h-16 w-32 items-center justify-center rounded-xl border border-border bg-card p-3 grayscale transition hover:grayscale-0"
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
        <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
          <h2 className="font-serif text-xl font-bold text-foreground">Receba nossas ofertas em primeira mão</h2>
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
      <div className="mb-4 flex items-end justify-between">
        <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-foreground">
          {title}
          {badge && <Badge variant="destructive">{badge}</Badge>}
        </h2>
        <Link href={viewAllHref} className="text-sm font-semibold text-foreground underline-offset-4 hover:underline">
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
