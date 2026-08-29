import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/services/product.service";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductPurchaseBox } from "@/components/storefront/product-purchase-box";
import { ReviewList } from "@/components/storefront/review-list";
import { ProductCard } from "@/components/storefront/product-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription || undefined,
    openGraph: {
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; companySlug: string }>;
}) {
  const { slug, companySlug } = await params;
  const base = `/loja/${companySlug}`;
  const [product, user] = await Promise.all([getProductBySlug(slug), getCurrentUser()]);

  if (!product || product.status === "ARCHIVED") notFound();

  const [related, isFavorited] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId),
    user
      ? prisma.wishlistItem
          .findFirst({ where: { userId: user.id, productId: product.id } })
          .then((r) => !!r)
      : Promise.resolve(false),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(product.avgRating),
            reviewCount: product.reviewCount,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: Number(product.price),
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-page py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href={base}>Início</Link> /{" "}
        {product.category && (
          <>
            <Link href={`${base}/produtos?categoria=${product.category.slug}`}>{product.category.name}</Link> /{" "}
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <div className="mb-2 flex items-center gap-2">
            {product.brand && <span className="text-sm text-muted-foreground">{product.brand.name}</span>}
          </div>
          <h1 className="mb-4 text-2xl font-bold">{product.name}</h1>

          <ProductPurchaseBox
            product={{
              id: product.id,
              name: product.name,
              price: product.price as unknown as number,
              compareAtPrice: product.compareAtPrice as unknown as number | null,
              stock: product.stock,
              sku: product.sku,
            }}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              options: v.options as Record<string, string>,
              price: v.price as unknown as number | null,
              compareAtPrice: v.compareAtPrice as unknown as number | null,
              stock: v.stock,
              imageUrl: v.imageUrl,
              active: v.active,
            }))}
            isLoggedIn={!!user}
            isFavorited={isFavorited}
          />

          <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Entrega para todo o Brasil
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Compra 100% segura
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" /> 7 dias para troca
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <Accordion type="multiple" defaultValue={["description", "specs"]}>
            <AccordionItem value="description">
              <AccordionTrigger className="text-lg font-semibold">Descrição</AccordionTrigger>
              <AccordionContent>
                <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">
                  {product.description || product.shortDescription || "Sem descrição disponível."}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="specs">
              <AccordionTrigger className="text-lg font-semibold">Especificações</AccordionTrigger>
              <AccordionContent>
                <table className="w-full text-sm">
                  <tbody>
                    {product.sku && <SpecRow label="SKU" value={product.sku} />}
                    {product.weightKg && <SpecRow label="Peso" value={`${product.weightKg} kg`} />}
                    {product.heightCm && <SpecRow label="Altura" value={`${product.heightCm} cm`} />}
                    {product.widthCm && <SpecRow label="Largura" value={`${product.widthCm} cm`} />}
                    {product.lengthCm && <SpecRow label="Comprimento" value={`${product.lengthCm} cm`} />}
                    {product.brand && <SpecRow label="Marca" value={product.brand.name} />}
                  </tbody>
                </table>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="text-lg font-semibold">Informações de entrega</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Calcule o frete e prazo de entrega na página do carrinho, informando seu CEP. Pedidos acima de{" "}
                {formatCurrency(299)} têm frete grátis na modalidade econômica.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq">
              <AccordionTrigger className="text-lg font-semibold">Perguntas frequentes</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Posso trocar o produto?</p>
                  <p>Sim, você tem até 7 dias corridos após o recebimento para solicitar a troca ou devolução.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Quais as formas de pagamento?</p>
                  <p>Aceitamos PIX, boleto e cartão de crédito em até 12x.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="reviews">
              <AccordionTrigger className="text-lg font-semibold">
                Avaliações ({product.reviewCount})
              </AccordionTrigger>
              <AccordionContent>
                <ReviewList
                  reviews={product.reviews}
                  avgRating={Number(product.avgRating)}
                  reviewCount={product.reviewCount}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
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
        </div>
      )}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 font-medium text-foreground">{label}</td>
      <td className="py-2 text-muted-foreground">{value}</td>
    </tr>
  );
}
