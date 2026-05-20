import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getStockSummary } from "@/lib/services/stock.service";
import { StockClient } from "./StockClient";

export default async function StockPage() {
  await getSession();

  const [rows, warehouses, categories] = await Promise.all([
    getStockSummary({}),
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <StockClient
      initial={rows.map((r) => ({
        productId: r.product.id,
        productName: r.product.name,
        productSku: r.product.sku,
        categoryId: r.product.categoryId,
        warehouseId: r.warehouse.id,
        warehouseName: r.warehouse.name,
        locationCode: r.location.code,
        locationName: r.location.name,
        quantity: Number(r.quantity),
        minStock: Number(r.product.minStock),
        unitSymbol: r.product.unit?.symbol ?? "",
      }))}
      warehouses={warehouses}
      categories={categories}
    />
  );
}
