"use client";

import { useDemo } from "@/lib/demo/store";
import { computeStock } from "@/lib/demo/types";

export default function DemoStockReport() {
  const { state } = useDemo();
  const stock = computeStock(state.movements);

  const productRows = state.products.map((p) => {
    const positions = stock.filter((b) => b.productId === p.id);
    const totalQty = positions.reduce((s, b) => s + b.quantity, 0);
    const unit = state.units.find((u) => u.id === p.unitId);
    const category = state.categories.find((c) => c.id === p.categoryId);
    const isLow = totalQty < p.minStock;
    return { product: p, totalQty, unit, category, isLow, positions };
  }).sort((a, b) => a.product.name.localeCompare(b.product.name));

  const totalPositions = stock.length;
  const lowCount = productRows.filter((r) => r.isLow).length;
  const outOfStock = productRows.filter((r) => r.totalQty === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Отчёт: Остатки на складах</h1>
        <p className="text-sm text-gray-500">Сводный отчёт по всем товарным позициям</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Всего позиций" value={String(state.products.length)} color="blue" />
        <StatCard label="Мест хранения" value={String(totalPositions)} color="gray" />
        <StatCard label="Критичных остатков" value={String(lowCount)} color="red" />
        <StatCard label="Нет в наличии" value={String(outOfStock)} color="orange" />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Сводка по товарам</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Товар</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Категория</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Итого кол-во</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Мин. остаток</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Мест хранения</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productRows.map(({ product, totalQty, unit, category, isLow, positions }) => (
              <tr key={product.id} className={`hover:bg-gray-50 ${isLow ? "bg-red-50" : ""}`}>
                <td className="px-4 py-3">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{product.sku}</div>
                </td>
                <td className="px-4 py-3 text-gray-500">{category?.name ?? "—"}</td>
                <td className={`px-4 py-3 text-right font-semibold ${totalQty === 0 ? "text-gray-400" : isLow ? "text-red-600" : "text-green-700"}`}>
                  {totalQty} {unit?.symbol}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{product.minStock} {unit?.symbol}</td>
                <td className="px-4 py-3 text-right text-gray-500">{positions.length}</td>
                <td className="px-4 py-3 text-center">
                  {totalQty === 0
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Нет</span>
                    : isLow
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Критично</span>
                      : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Норма</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Распределение по складам</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {state.warehouses.map((wh) => {
            const whStock = stock.filter((b) => b.warehouseId === wh.id);
            const uniqueProducts = new Set(whStock.map((b) => b.productId)).size;
            return (
              <div key={wh.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{wh.name}</div>
                  <div className="text-xs text-gray-500">{wh.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-700">{uniqueProducts} наименований</div>
                  <div className="text-xs text-gray-400">{whStock.length} мест хранения</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
    red: "bg-red-50 border-red-200 text-red-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  };
  return (
    <div className={`border rounded-lg p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}
