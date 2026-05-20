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

/**
 * Returns a map of productId -> total quantity across all warehouses/locations.
 * Only products that have any movement history are present.
 */
export async function getStockTotalsByProduct(productIds?: string[]): Promise<Map<string, number>> {
  const grouped = await db.stockMovement.groupBy({
    by: ["productId"],
    _sum: { quantityChange: true },
    where: productIds ? { productId: { in: productIds } } : undefined,
  });
  const map = new Map<string, number>();
  for (const row of grouped) {
    map.set(row.productId, Number(row._sum.quantityChange ?? 0));
  }
  return map;
}

/**
 * Returns per-location stock for a single product (only positive balances).
 */
export async function getProductStockBreakdown(productId: string) {
  const grouped = await db.stockMovement.groupBy({
    by: ["productId", "warehouseId", "storageLocationId"],
    _sum: { quantityChange: true },
    where: { productId },
  });

  const warehouseIds = Array.from(new Set(grouped.map((g) => g.warehouseId)));
  const locationIds = Array.from(new Set(grouped.map((g) => g.storageLocationId)));
  const [warehouses, locations] = await Promise.all([
    db.warehouse.findMany({ where: { id: { in: warehouseIds } } }),
    db.storageLocation.findMany({ where: { id: { in: locationIds } } }),
  ]);

  return grouped
    .map((row) => {
      const quantity = Number(row._sum.quantityChange ?? 0);
      return {
        warehouseId: row.warehouseId,
        warehouseName: warehouses.find((w) => w.id === row.warehouseId)?.name ?? "",
        storageLocationId: row.storageLocationId,
        locationCode: locations.find((l) => l.id === row.storageLocationId)?.code ?? "",
        locationName: locations.find((l) => l.id === row.storageLocationId)?.name ?? "",
        quantity,
      };
    })
    .filter((b) => b.quantity !== 0)
    .sort((a, b) => a.warehouseName.localeCompare(b.warehouseName) || a.locationCode.localeCompare(b.locationCode));
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
