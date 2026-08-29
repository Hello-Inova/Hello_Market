import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma, InventoryMovementType } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Adjusts stock for a product or variant inside a DB transaction and writes
 * an InventoryMovement row. Throws INSUFFICIENT_STOCK if the delta would
 * push stock below zero — this is the single choke point that guarantees
 * the system never sells more than it has, regardless of caller.
 */
export async function adjustStock(
  tx: Tx,
  params: {
    productId: string;
    variantId?: string | null;
    delta: number; // negative = decrement (sale), positive = increment (restock)
    type: InventoryMovementType;
    reason?: string;
    orderId?: string;
    userId?: string;
  }
) {
  if (params.variantId) {
    const variant = await tx.productVariant.findUniqueOrThrow({
      where: { id: params.variantId },
    });
    const newStock = variant.stock + params.delta;
    if (newStock < 0) throw new Error("INSUFFICIENT_STOCK");

    await tx.productVariant.update({
      where: { id: params.variantId },
      data: { stock: newStock },
    });

    await tx.inventoryMovement.create({
      data: {
        productId: params.productId,
        variantId: params.variantId,
        type: params.type,
        quantity: params.delta,
        resultStock: newStock,
        reason: params.reason,
        orderId: params.orderId,
        userId: params.userId,
      },
    });

    return newStock;
  }

  const product = await tx.product.findUniqueOrThrow({
    where: { id: params.productId },
  });
  const newStock = product.stock + params.delta;
  if (newStock < 0) throw new Error("INSUFFICIENT_STOCK");

  await tx.product.update({
    where: { id: params.productId },
    data: { stock: newStock },
  });

  await tx.inventoryMovement.create({
    data: {
      productId: params.productId,
      type: params.type,
      quantity: params.delta,
      resultStock: newStock,
      reason: params.reason,
      orderId: params.orderId,
      userId: params.userId,
    },
  });

  return newStock;
}

export async function getStockSummary() {
  const [lowStock, outOfStock, totalValue] = await Promise.all([
    prisma.product.count({
      where: { stock: { gt: 0 }, status: "ACTIVE" },
    }),
    prisma.product.count({ where: { stock: 0, status: "ACTIVE" } }),
    prisma.product.aggregate({
      _sum: { stock: true },
    }),
  ]);

  const lowStockProducts = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      stock: { gt: 0 },
    },
    select: { id: true, name: true, stock: true, minStock: true, price: true },
  });

  const belowMinimum = lowStockProducts.filter((p) => p.stock <= p.minStock);

  const stockValue = await prisma.$queryRaw<{ total: string }[]>`
    SELECT COALESCE(SUM("stock" * "price"), 0)::text as total FROM "Product" WHERE status = 'ACTIVE'
  `;

  return {
    activeWithStock: lowStock,
    outOfStock,
    belowMinimumCount: belowMinimum.length,
    belowMinimum,
    totalUnits: totalValue._sum.stock ?? 0,
    estimatedValue: parseFloat(stockValue[0]?.total ?? "0"),
  };
}
