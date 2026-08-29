import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, published: true } });
  if (!page) return { title: "Página não encontrada" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, published: true } });

  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="mb-6 text-3xl font-bold">{page.title}</h1>
      <div
        className="cms-content"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
