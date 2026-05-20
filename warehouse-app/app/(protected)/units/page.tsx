import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { UnitsClient } from "./UnitsClient";

export default async function UnitsPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);
  const units = await db.unit.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  return (
    <UnitsClient
      initial={units.map((u) => ({
        id: u.id, name: u.name, symbol: u.symbol, productsCount: u._count.products,
      }))}
    />
  );
}
