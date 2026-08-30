import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { enterTenant } from "@/lib/tenant/context";
import { companyThemeStyle } from "@/lib/tenant/theme";

// Fase 4 — favicon por empresa: generateMetadata roda antes da renderização
// e mescla com o metadata do layout raiz (app/layout.tsx), então só
// precisa declarar o que muda por empresa (o favicon); quando a empresa não
// tem um configurado, retorna {} e o favicon padrão do app raiz continua
// valendo, sem precisar duplicar o resto do metadata aqui.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}): Promise<Metadata> {
  const { companySlug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { faviconUrl: true },
  });
  if (!company?.faviconUrl) return {};
  return { icons: { icon: company.faviconUrl } };
}

export default async function LojaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;

  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) notFound();
  enterTenant({ companyId: company.id, companySlug: company.slug });

  return (
    <>
      {/* Fase 4 — tema por empresa: ver lib/tenant/theme.ts. Um <style> é um
          elemento HTML válido em qualquer posição da árvore — o seletor
          :root não depende de onde a tag fica no DOM, só da ordem em que
          aparece na cascata (por isso funciona mesmo fora do <head>). */}
      <style>{companyThemeStyle(company)}</style>
      {children}
    </>
  );
}
