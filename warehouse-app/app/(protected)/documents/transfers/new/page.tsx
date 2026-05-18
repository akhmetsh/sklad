import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransferDocumentForm } from "@/components/documents/TransferDocumentForm";

export default async function NewTransferPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const [warehouses, products, locations] = await Promise.all([
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { isActive: true }, include: { unit: true }, orderBy: { name: "asc" } }),
    db.storageLocation.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Новое перемещение" backHref="/documents/transfers" />
      <TransferDocumentForm warehouses={warehouses} products={products} locations={locations} />
    </div>
  );
}
