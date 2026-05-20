import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/forms/ProductForm";
import { t } from "@/lib/i18n";

export default async function NewProductPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const [categories, units] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.unit.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, symbol: true } }),
  ]);

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title={t.products.newTitle} backHref="/products" />
      <ProductForm categories={categories} units={units} />
    </div>
  );
}
