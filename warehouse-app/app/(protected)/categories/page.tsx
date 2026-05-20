import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriesPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  return (
    <CategoriesClient
      initial={categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        productsCount: c._count.products,
      }))}
    />
  );
}
