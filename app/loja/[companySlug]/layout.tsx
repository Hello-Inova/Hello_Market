import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveTenantBySlug } from "@/lib/tenant/resolve";
import { enterTenant } from "@/lib/tenant/context";

export default async function LojaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;

  const tenant = await resolveTenantBySlug(prisma, companySlug);
  if (!tenant) notFound();
  enterTenant(tenant);

  return <>{children}</>;
}
