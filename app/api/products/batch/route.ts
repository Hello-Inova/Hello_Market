import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { productIds } = (await request.json()) as { productIds: string[] };
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds.slice(0, 100) } },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      variants: true,
    },
  });

  return NextResponse.json({ products });
}
