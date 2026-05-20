import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getStockSummary } from "@/lib/services/stock.service";
import { StockReportClient } from "./StockReportClient";

export default async function StockReportPage() {
  await getSession();

  const [rows, warehouses] = await Promise.all([
    getStockSummary({}),
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, address: true } }),
  ]);

  return (
    <StockReportClient
      rows={rows.map((r) => ({
        productId: r.product.id,
        productName: r.product.name,
        productSku: r.product.sku,
        categoryName: r.product.category.name,
        warehouseId: r.warehouse.id,
        warehouseName: r.warehouse.name,
        locationCode: r.location.code,
        locationName: r.location.name,
        quantity: Number(r.quantity),
        minStock: Number(r.product.minStock),
        unitSymbol: r.product.unit?.symbol ?? "",
      }))}
      warehouses={warehouses}
    />
  );
}
