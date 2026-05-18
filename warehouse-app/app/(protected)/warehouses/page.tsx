import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { InlineCreateForm } from "@/components/ui/InlineCreateForm";

export default async function WarehousesPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const warehouses = await db.warehouse.findMany({
    include: { _count: { select: { locations: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Склады" description="Справочник складов">
        <InlineCreateForm
          title="Создать склад"
          endpoint="/api/warehouses"
          fields={[
            { name: "name", label: "Название", required: true },
            { name: "address", label: "Адрес" },
            { name: "description", label: "Описание" },
          ]}
        />
      </PageHeader>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Название</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Адрес</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Мест хранения</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {warehouses.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{w.name}</td>
                <td className="px-4 py-3 text-gray-600">{w.address ?? "—"}</td>
                <td className="px-4 py-3 text-right">{w._count.locations}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${w.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {w.isActive ? "Активен" : "Неактивен"}
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
