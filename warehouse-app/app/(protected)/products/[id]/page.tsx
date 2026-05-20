import { notFound } from "next/navigation";
import Link from "next/link";
import { History } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getProductStockBreakdown } from "@/lib/services/stock.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/forms/ProductForm";
import { StockStatusBadge } from "@/components/ui/StatusBadge";
import { Barcode } from "@/components/ui/Barcode";
import { formatQuantity } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const [product, categories, units, stockBreakdown] = await Promise.all([
    db.product.findUnique({
      where: { id: params.id },
      include: { unit: true },
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.unit.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, symbol: true } }),
    getProductStockBreakdown(params.id),
  ]);

  if (!product) notFound();

  const totalStock = stockBreakdown.reduce((s, b) => s + b.quantity, 0);
  const minStock = Number(product.minStock);

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title={`${t.common.edit}: ${product.name}`} backHref="/products">
        <Link href={`/products/${product.id}/movements`}>
          <Button variant="secondary"><History className="w-4 h-4" /> {t.products.viewHistory}</Button>
        </Link>
      </PageHeader>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-gray-700">{t.products.currentStock}</h2>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono font-semibold ${totalStock === 0 ? "text-gray-400" : totalStock < minStock ? "text-red-600" : "text-green-700"}`}>
              {formatQuantity(totalStock, product.unit.symbol)}
            </span>
            <StockStatusBadge quantity={totalStock} minStock={minStock} />
          </div>
        </div>
        {stockBreakdown.length === 0 ? (
          <p className="px-4 sm:px-6 py-4 text-sm text-gray-400">{t.dashboard.empty}</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {stockBreakdown.map((b) => (
              <li key={`${b.warehouseId}-${b.storageLocationId}`} className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-gray-700">{b.warehouseName}</p>
                  <p className="text-xs text-gray-400 font-mono">{b.locationCode} — {b.locationName}</p>
                </div>
                <span className={`font-mono font-semibold tabular-nums ${b.quantity < minStock ? "text-red-600" : "text-green-700"}`}>
                  {formatQuantity(b.quantity, product.unit.symbol)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {product.barcode && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.products.barcodeLabel}</h2>
          <div className="flex justify-center">
            <Barcode value={product.barcode} type="code128" height={14} scale={2} />
          </div>
        </div>
      )}

      <ProductForm categories={categories} units={units} product={product} />
    </div>
  );
}
