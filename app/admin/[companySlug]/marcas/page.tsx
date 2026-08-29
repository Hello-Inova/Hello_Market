import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BrandManager } from "@/components/admin/brand-manager";

export const metadata: Metadata = { title: "Marcas" };

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marcas</h1>
      <BrandManager brands={brands} />
    </div>
  );
}
