import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { InlineCreateForm } from "@/components/ui/InlineCreateForm";

export default async function UnitsPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const units = await db.unit.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <PageHeader title="Единицы измерения" description="Справочник единиц измерения">
        <InlineCreateForm
          title="Создать единицу"
          endpoint="/api/units"
          fields={[
            { name: "name", label: "Название (напр. Штука)", required: true },
            { name: "symbol", label: "Обозначение (напр. шт)", required: true },
          ]}
        />
      </PageHeader>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Название</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Обозначение</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {units.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 font-mono">{u.symbol}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.isActive ? "Активна" : "Неактивна"}
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
