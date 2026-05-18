import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { InlineCreateForm } from "@/components/ui/InlineCreateForm";

export default async function CategoriesPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <PageHeader title="Категории товаров" description="Справочник категорий">
        <InlineCreateForm
          title="Создать категорию"
          endpoint="/api/categories"
          fields={[
            { name: "name", label: "Название", required: true },
            { name: "description", label: "Описание" },
          ]}
        />
      </PageHeader>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Название</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Описание</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.description ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.isActive ? "Активна" : "Неактивна"}
                  </span>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Категории не найдены</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
