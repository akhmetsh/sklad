import { getSession } from "@/lib/auth/session";
import { getStockSummary } from "@/lib/services/stock.service";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function StockReportPage() {
  await getSession();

  const rows = await getStockSummary({});
  const totalPositions = rows.length;
  const lowStockCount = rows.filter((r) => r.isLow).length;

  return (
    <div className="space-y-4">
      <PageHeader title="Отчет по остаткам" description={`Всего позиций: ${totalPositions} | Дефицитных: ${lowStockCount}`} />

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Товар</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Категория</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Склад</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Место</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Остаток</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Минимум</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className={row.isLow ? "bg-red-50" : "hover:bg-gray-50"}>
                <td className="px-4 py-3 font-medium">{row.product.name}</td>
                <td className="px-4 py-3">{row.product.category.name}</td>
                <td className="px-4 py-3">{row.warehouse.name}</td>
                <td className="px-4 py-3">{row.location.name}</td>
                <td className="px-4 py-3 text-right font-semibold">{row.quantity.toString()}</td>
                <td className="px-4 py-3 text-right text-gray-500">{row.product.minStock.toString()}</td>
                <td className="px-4 py-3">
                  {row.isLow ? (
                    <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Дефицит</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">В норме</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
