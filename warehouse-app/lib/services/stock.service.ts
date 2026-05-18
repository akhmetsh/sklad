import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function getStockBalance(
  productId: string,
  warehouseId: string,
  storageLocationId: string
): Promise<Decimal> {
  const result = await db.stockMovement.aggregate({
    where: { productId, warehouseId, storageLocationId },
    _sum: { quantityChange: true },
  });
  return result._sum.quantityChange ?? new Decimal(0);
}

export async function checkSufficientStock(
  productId: string,
  warehouseId: string,
  storageLocationId: string,
  required: Decimal
): Promise<boolean> {
  const balance = await getStockBalance(productId, warehouseId, storageLocationId);
  return balance.greaterThanOrEqualTo(required);
}

export async function getStockSummary(filters: {
  warehouseId?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}) {
  const movements = await db.stockMovement.groupBy({
    by: ["productId", "warehouseId", "storageLocationId"],
    _sum: { quantityChange: true },
    where: {
      warehouseId: filters.warehouseId,
      product: filters.categoryId ? { categoryId: filters.categoryId } : undefined,
    },
  });

  const productIds = Array.from(new Set(movements.map((m) => m.productId)));
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true, unit: true },
  });

  const warehouses = await db.warehouse.findMany();
  const locations = await db.storageLocation.findMany();

  const rows = movements.map((m) => {
    const product = products.find((p) => p.id === m.productId)!;
    const warehouse = warehouses.find((w) => w.id === m.warehouseId)!;
    const location = locations.find((l) => l.id === m.storageLocationId)!;
    const quantity = m._sum.quantityChange ?? new Decimal(0);

    return {
      product,
      warehouse,
      location,
      quantity,
      isLow: quantity.lessThan(product.minStock),
    };
  });

  return filters.lowStockOnly ? rows.filter((r) => r.isLow) : rows;
}

export async function getMovementHistory(filters: {
  productId?: string;
  warehouseId?: string;
  limit?: number;
}) {
  return db.stockMovement.findMany({
    where: {
      productId: filters.productId,
      warehouseId: filters.warehouseId,
    },
    include: {
      product: true,
      warehouse: true,
      storageLocation: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
  });
}
