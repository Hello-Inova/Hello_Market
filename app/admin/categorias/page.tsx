import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categorias" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorias</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
