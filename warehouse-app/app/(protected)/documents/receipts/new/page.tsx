import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReceiptDocumentForm } from "@/components/documents/ReceiptDocumentForm";

export default async function NewReceiptPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const [suppliers, warehouses, products, locations] = await Promise.all([
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { isActive: true }, include: { unit: true }, orderBy: { name: "asc" } }),
    db.storageLocation.findMany({ where: { isActive: true }, include: { warehouse: true }, orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Новое поступление" backHref="/documents/receipts" />
      <ReceiptDocumentForm
        suppliers={suppliers}
        warehouses={warehouses}
        products={products}
        locations={locations}
      />
    </div>
  );
}
