import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveTenantBySlug } from "@/lib/tenant/resolve";
import { enterTenant } from "@/lib/tenant/context";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;

  // Leitura: resolve o tenant a partir do slug da URL e amarra o contexto
  // antes de renderizar {children} — cobre todo Server Component aninhado
  // (produtos, pedidos, etc.) que consulta o Prisma direto sem passar por
  // requirePermission().
  const tenant = await resolveTenantBySlug(prisma, companySlug);
  if (!tenant) notFound();
  enterTenant(tenant);

  const admin = await getCurrentAdmin();

  if (!admin) {
    // Sem sessão: só /admin/[companySlug]/login renderiza aqui (o proxy
    // redireciona qualquer outra rota /admin/[companySlug]/* quando o
    // cookie de sessão está ausente).
    return <>{children}</>;
  }

  if (admin.companySlug !== companySlug) {
    // A sessão pertence a outra empresa: a URL nunca deveria, por si só,
    // conceder acesso a dados de outra empresa (o isolamento real é pelo
    // companyId da sessão) — este redirect é só higiene de UX.
    redirect(`/admin/${admin.companySlug}`);
  }

  return (
    <AdminShell admin={{ name: admin.name, email: admin.email, role: admin.role, avatarUrl: admin.avatarUrl }}>
      {children}
    </AdminShell>
  );
}
