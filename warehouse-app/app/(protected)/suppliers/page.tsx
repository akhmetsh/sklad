import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { InlineCreateForm } from "@/components/ui/InlineCreateForm";

export default async function SuppliersPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const suppliers = await db.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <PageHeader title="Поставщики" description="Справочник поставщиков">
        <InlineCreateForm
          title="Создать поставщика"
          endpoint="/api/suppliers"
          fields={[
            { name: "name", label: "Название организации", required: true },
            { name: "contactPerson", label: "Контактное лицо" },
            { name: "phone", label: "Телефон" },
            { name: "email", label: "Email", type: "email" },
            { name: "address", label: "Адрес" },
          ]}
        />
      </PageHeader>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Название</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Контактное лицо</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Телефон</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.contactPerson ?? "—"}</td>
                <td className="px-4 py-3">{s.phone ?? "—"}</td>
                <td className="px-4 py-3">{s.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isActive ? "Активен" : "Неактивен"}
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
