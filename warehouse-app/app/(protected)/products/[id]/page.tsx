import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/forms/ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const [product, categories, units] = await Promise.all([
    db.product.findUnique({ where: { id: params.id } }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.unit.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title={`Редактировать: ${product.name}`} backHref="/products" />
      <ProductForm categories={categories} units={units} product={product} />
    </div>
  );
}
