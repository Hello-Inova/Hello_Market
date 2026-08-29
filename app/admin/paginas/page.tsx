import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageManager } from "@/components/admin/page-manager";

export const metadata: Metadata = { title: "Páginas" };

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Páginas</h1>
      <PageManager pages={pages} />
    </div>
  );
}
