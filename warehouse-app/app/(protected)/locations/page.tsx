import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { LocationCreateForm } from "@/components/ui/LocationCreateForm";

export default async function LocationsPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const [locations, warehouses] = await Promise.all([
    db.storageLocation.findMany({
      include: { warehouse: true },
      orderBy: [{ warehouse: { name: "asc" } }, { code: "asc" }],
    }),
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Места хранения" description="Зоны, полки и ячейки на складах">
        <LocationCreateForm warehouses={warehouses} />
      </PageHeader>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Код</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Название</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Склад</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locations.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">{l.code}</td>
                <td className="px-4 py-3">{l.name}</td>
                <td className="px-4 py-3">{l.warehouse.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${l.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {l.isActive ? "Активно" : "Неактивно"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
