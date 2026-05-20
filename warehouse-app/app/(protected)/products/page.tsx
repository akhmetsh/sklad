import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getStockTotalsByProduct } from "@/lib/services/stock.service";
import { ProductsClient } from "./ProductsClient";

export default async function ProductsPage() {
  await getSession();

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: { category: true, unit: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const stockTotals = await getStockTotalsByProduct(products.map((p) => p.id));

  return (
    <ProductsClient
      initial={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        unitId: p.unitId,
        unitSymbol: p.unit.symbol,
        minStock: Number(p.minStock),
        stockTotal: stockTotals.get(p.id) ?? 0,
      }))}
      categories={categories}
    />
  );
}
