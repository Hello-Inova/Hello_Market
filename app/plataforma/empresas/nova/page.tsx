import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CompanyCreateForm } from "@/components/platform/company-create-form";

export const metadata: Metadata = { title: "Nova empresa — Plataforma" };

export default async function NewCompanyPage() {
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nova empresa</h1>
        <p className="text-sm text-muted-foreground">
          Cria a loja, o painel admin e o primeiro usuário responsável em um único passo.
        </p>
      </div>
      <CompanyCreateForm plans={plans} />
    </div>
  );
}
