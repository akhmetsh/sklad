import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function ProductsPage() {
  await getSession();

  const products = await db.product.findMany({
    include: { category: true, unit: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Товары" description="Каталог товарных позиций">
        <Link
          href="/products/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Создать товар
        </Link>
      </PageHeader>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Название</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Артикул</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Категория</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Ед. изм.</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Мин. остаток</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{p.sku}</td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3">{p.unit.symbol}</td>
                <td className="px-4 py-3 text-right">{p.minStock.toString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isActive ? "Активен" : "Неактивен"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/products/${p.id}`} className="text-blue-600 hover:underline text-xs">
                    Изменить
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Товары не найдены. <Link href="/products/new" className="text-blue-600 hover:underline">Создать первый</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
