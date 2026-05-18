import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getMovementHistory } from "@/lib/services/stock.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function DashboardPage() {
  await getSession();

  const [totalProducts, totalWarehouses, recentMovements, draftReceipts] =
    await Promise.all([
      db.product.count({ where: { isActive: true } }),
      db.warehouse.count({ where: { isActive: true } }),
      getMovementHistory({ limit: 5 }),
      db.receiptDocument.count({ where: { status: "DRAFT" } }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд" description="Сводная информация по складу" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Товаров в каталоге" value={totalProducts} />
        <StatCard label="Активных складов" value={totalWarehouses} />
        <StatCard label="Черновиков поступлений" value={draftReceipts} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">Последние движения</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Товар</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Склад</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Тип</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Кол-во</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentMovements.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2">{m.product.name}</td>
                <td className="px-4 py-2">{m.warehouse.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge type="movement" value={m.movementType} />
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {m.quantityChange.toString()}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {new Date(m.createdAt).toLocaleDateString("ru-RU")}
                </td>
              </tr>
            ))}
            {recentMovements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Движений пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
