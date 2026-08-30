import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Prisma, CompanyStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Empresas — Plataforma" };

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "secondary" | "warning" | "destructive" }> = {
  TRIAL: { label: "Trial", variant: "secondary" },
  ACTIVE: { label: "Ativa", variant: "success" },
  PAST_DUE: { label: "Pagamento pendente", variant: "warning" },
  SUSPENDED: { label: "Suspensa", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
};

export default async function PlatformCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pagina?: string }>;
}) {
  const { q, status, pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);
  const perPage = 20;

  const where: Prisma.CompanyWhereInput = {};
  if (status) where.status = status as CompanyStatus;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.company.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/plataforma/empresas/nova">
            <Plus className="mr-1 h-4 w-4" /> Nova empresa
          </Link>
        </Button>
      </div>

      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por nome, identificador ou e-mail..." className="max-w-xs" />
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Ativa</option>
          <option value="PAST_DUE">Pagamento pendente</option>
          <option value="SUSPENDED">Suspensa</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm">Filtrar</button>
      </form>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Empresa</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Status</th>
              <th className="p-3">Cadastro</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => {
              const status = STATUS_LABEL[c.status] ?? STATUS_LABEL.TRIAL;
              return (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">/loja/{c.slug}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{c.subscription?.plan.name ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="p-3 text-right">
                    <Link href={`/plataforma/empresas/${c.id}`} className="text-primary hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
            {companies.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} empresa(s)</span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/plataforma/empresas?pagina=${page - 1}`} className="text-primary hover:underline">
              Anterior
            </Link>
          )}
          {page * perPage < total && (
            <Link href={`/plataforma/empresas?pagina=${page + 1}`} className="text-primary hover:underline">
              Próxima
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
