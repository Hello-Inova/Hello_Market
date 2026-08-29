import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export const metadata: Metadata = { title: "Produtos" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  ARCHIVED: "Arquivado",
};
const STATUS_VARIANT: Record<string, "success" | "outline" | "secondary" | "destructive"> = {
  DRAFT: "outline",
  ACTIVE: "success",
  INACTIVE: "secondary",
  ARCHIVED: "destructive",
};

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companySlug: string }>;
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  const { companySlug } = await params;
  const { q, pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);
  const perPage = 20;

  const where = q
    ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { sku: { contains: q, mode: "insensitive" as const } }] }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { take: 1, orderBy: { order: "asc" } }, category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button asChild>
          <Link href={`/admin/${companySlug}/produtos/novo`}>
            <Plus className="h-4 w-4" /> Novo produto
          </Link>
        </Button>
      </div>

      <form className="max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Buscar por nome ou SKU..." />
      </form>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Produto</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Estoque</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {p.images[0] && <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="40px" />}
                    </div>
                    <Link href={`/admin/${companySlug}/produtos/${p.id}`} className="font-medium hover:text-primary line-clamp-1 max-w-xs">
                      {p.name}
                    </Link>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{p.sku}</td>
                <td className="p-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                <td className="p-3">{formatCurrency(Number(p.price))}</td>
                <td className={`p-3 ${p.stock <= p.minStock ? "text-amber-600 font-medium" : ""}`}>{p.stock}</td>
                <td className="p-3">
                  <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                </td>
                <td className="p-3">
                  <ProductRowActions productId={p.id} status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} produto(s)</span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/admin/${companySlug}/produtos?pagina=${page - 1}${q ? `&q=${q}` : ""}`} className="text-primary hover:underline">
              Anterior
            </Link>
          )}
          {page * perPage < total && (
            <Link href={`/admin/${companySlug}/produtos?pagina=${page + 1}${q ? `&q=${q}` : ""}`} className="text-primary hover:underline">
              Próxima
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
