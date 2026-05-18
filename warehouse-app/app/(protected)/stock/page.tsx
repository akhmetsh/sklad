import { getSession } from "@/lib/auth/session";
import { getStockSummary } from "@/lib/services/stock.service";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function StockPage({
  searchParams,
}: {
  searchParams: { warehouseId?: string; categoryId?: string; lowStock?: string };
}) {
  await getSession();

  const [rows, warehouses, categories] = await Promise.all([
    getStockSummary({
      warehouseId: searchParams.warehouseId,
      categoryId: searchParams.categoryId,
      lowStockOnly: searchParams.lowStock === "1",
    }),
    db.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Остатки" description="Текущие складские остатки" />

      <form className="flex gap-3 flex-wrap">
        <select name="warehouseId" defaultValue={searchParams.warehouseId ?? ""} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Все склады</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select name="categoryId" defaultValue={searchParams.categoryId ?? ""} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="lowStock" value="1" defaultChecked={searchParams.lowStock === "1"} />
          Только дефицитные
        </label>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Применить
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Товар</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Артикул</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Склад</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Место хранения</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Остаток</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Минимум</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className={row.isLow ? "bg-red-50" : "hover:bg-gray-50"}>
                <td className="px-4 py-3 font-medium">{row.product.name}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{row.product.sku}</td>
                <td className="px-4 py-3">{row.warehouse.name}</td>
                <td className="px-4 py-3">{row.location.name}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {row.quantity.toString()} {row.product.unit?.symbol}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {row.product.minStock.toString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Нет данных по остаткам</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
