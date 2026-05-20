import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { WarehousesClient } from "./WarehousesClient";

export default async function WarehousesPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);
  const warehouses = await db.warehouse.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { locations: { where: { isActive: true } } } } },
  });

  return (
    <WarehousesClient
      initial={warehouses.map((w) => ({
        id: w.id, name: w.name, address: w.address, description: w.description,
        locationsCount: w._count.locations,
      }))}
    />
  );
}
