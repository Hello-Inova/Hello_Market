import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CompanyEditForm } from "@/components/platform/company-edit-form";
import { SubscriptionForm } from "@/components/platform/subscription-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Empresa — Plataforma" };

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [company, subscription, plans, adminCount] = await Promise.all([
    prisma.company.findUnique({ where: { id } }),
    prisma.subscription.findUnique({ where: { companyId: id } }),
    prisma.plan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } }),
    prisma.adminUser.count({ where: { companyId: id } }),
  ]);

  if (!company) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <p className="text-sm text-muted-foreground">
          /loja/{company.slug} · /admin/{company.slug} · {adminCount} usuário(s) admin
        </p>
      </div>

      <SubscriptionForm companyId={company.id} subscription={subscription} plans={plans} />

      <CompanyEditForm company={company} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Informações internas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          <span>ID: {company.id}</span>
          <span>Criada em: {company.createdAt.toLocaleString("pt-BR")}</span>
        </CardContent>
      </Card>
    </div>
  );
}
