import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Clientes" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pagina?: string }>;
}) {
  const { q, status, pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);
  const perPage = 20;

  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (status === "blocked") where.blocked = true;
  if (status === "active") where.blocked = false;
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { document: { contains: q, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por nome, e-mail ou CPF/CNPJ..." className="max-w-xs" />
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="blocked">Bloqueados</option>
        </select>
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm">Filtrar</button>
      </form>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Cadastro</th>
              <th className="p-3">Pedidos</th><th className="p-3">Status</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.fullName}</td>
                <td className="p-3 text-muted-foreground">{c.email}</td>
                <td className="p-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                <td className="p-3">{c._count.orders}</td>
                <td className="p-3">
                  <Badge variant={c.blocked ? "destructive" : "success"}>{c.blocked ? "Bloqueado" : "Ativo"}</Badge>
                </td>
                <td className="p-3 text-right">
                  <Link href={`/admin/clientes/${c.id}`} className="text-primary hover:underline">Ver</Link>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} cliente(s)</span>
        <div className="flex gap-2">
          {page > 1 && <Link href={`/admin/clientes?pagina=${page - 1}`} className="text-primary hover:underline">Anterior</Link>}
          {page * perPage < total && <Link href={`/admin/clientes?pagina=${page + 1}`} className="text-primary hover:underline">Próxima</Link>}
        </div>
      </div>
    </div>
  );
}
