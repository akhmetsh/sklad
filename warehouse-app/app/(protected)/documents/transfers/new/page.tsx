import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransferDocumentForm } from "@/components/documents/TransferDocumentForm";
import { t } from "@/lib/i18n";

export default async function NewTransferPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const [warehouses, products, locations, stockMovements] = await Promise.all([
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: { select: { symbol: true } } },
    }),
    db.storageLocation.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, name: true, code: true, warehouseId: true },
    }),
    db.stockMovement.groupBy({
      by: ["productId", "warehouseId", "storageLocationId"],
      _sum: { quantityChange: true },
    }),
  ]);

  const stock = stockMovements
    .map((row) => ({
      productId: row.productId,
      warehouseId: row.warehouseId,
      storageLocationId: row.storageLocationId,
      quantity: Number(row._sum.quantityChange ?? 0),
    }))
    .filter((s) => s.quantity > 0);

  return (
    <div className="space-y-4 max-w-5xl">
      <PageHeader title={t.documents.transfers.newTitle} backHref="/documents/transfers" />
      <TransferDocumentForm warehouses={warehouses} products={products} locations={locations} stock={stock} />
    </div>
  );
}
