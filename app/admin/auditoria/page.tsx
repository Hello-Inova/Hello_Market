import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/admin-session";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Auditoria" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; acao?: string; pagina?: string }>;
}) {
  await requirePermission("audit.view");
  const { q, acao, pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);
  const perPage = 40;

  const where: Prisma.AuditLogWhereInput = {};
  if (acao) where.action = { contains: acao, mode: "insensitive" };
  if (q) {
    where.OR = [
      { entity: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      { admin: { name: { contains: q, mode: "insensitive" } } },
      { user: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { admin: { select: { name: true } }, user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Auditoria</h1>

      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por entidade, ID ou responsável..." className="max-w-xs" />
        <Input name="acao" defaultValue={acao} placeholder="Ação (ex: order.update_status)" className="max-w-xs" />
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm">Filtrar</button>
      </form>

      <div className="table-scroll rounded-xl border bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-muted-foreground">
              <th className="p-3">Data</th><th className="p-3">Responsável</th><th className="p-3">Ação</th>
              <th className="p-3">Entidade</th><th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDateTime(log.createdAt)}</td>
                <td className="p-3">{log.admin?.name ?? log.user?.fullName ?? "Sistema"}</td>
                <td className="p-3"><Badge variant="outline">{log.action}</Badge></td>
                <td className="p-3 text-muted-foreground">{log.entity}{log.entityId ? ` #${log.entityId.slice(-8)}` : ""}</td>
                <td className="p-3 text-muted-foreground">{log.ip ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum evento registrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} evento(s)</span>
        <div className="flex gap-2">
          {page > 1 && <Link href={`/admin/auditoria?pagina=${page - 1}`} className="text-primary hover:underline">Anterior</Link>}
          {page * perPage < total && <Link href={`/admin/auditoria?pagina=${page + 1}`} className="text-primary hover:underline">Próxima</Link>}
        </div>
      </div>
    </div>
  );
}
