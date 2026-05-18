import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/forms/ProductForm";

export default async function NewProductPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const [categories, units] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.unit.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title="Создать товар" backHref="/products" />
      <ProductForm categories={categories} units={units} />
    </div>
  );
}
