import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { LocationsClient } from "./LocationsClient";

export default async function LocationsPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);
  const [locations, warehouses] = await Promise.all([
    db.storageLocation.findMany({
      where: { isActive: true },
      include: { warehouse: { select: { id: true, name: true } } },
      orderBy: [{ warehouse: { name: "asc" } }, { code: "asc" }],
    }),
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <LocationsClient
      initial={locations.map((l) => ({
        id: l.id, code: l.code, name: l.name, description: l.description,
        warehouseId: l.warehouseId, warehouseName: l.warehouse.name,
      }))}
      warehouses={warehouses}
    />
  );
}
