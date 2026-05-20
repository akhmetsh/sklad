import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReceiptDocumentForm } from "@/components/documents/ReceiptDocumentForm";
import { t } from "@/lib/i18n";

export default async function NewReceiptPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const [suppliers, warehouses, products, locations] = await Promise.all([
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
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
  ]);

  return (
    <div className="space-y-4 max-w-5xl">
      <PageHeader title={t.documents.receipts.newTitle} backHref="/documents/receipts" />
      <ReceiptDocumentForm
        suppliers={suppliers}
        warehouses={warehouses}
        products={products}
        locations={locations}
      />
    </div>
  );
}
