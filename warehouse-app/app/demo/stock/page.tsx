"use client";

import { useState } from "react";
import { useDemo } from "@/lib/demo/store";
import { computeStock } from "@/lib/demo/types";

export default function DemoStock() {
  const { state } = useDemo();
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState("");

  const stock = computeStock(state.movements);

  const rows = stock
    .map((b) => {
      const product = state.products.find((p) => p.id === b.productId);
      const warehouse = state.warehouses.find((w) => w.id === b.warehouseId);
      const location = state.locations.find((l) => l.id === b.storageLocationId);
      const unit = state.units.find((u) => u.id === product?.unitId);
      const isLow = product ? b.quantity < product.minStock : false;
      return { ...b, product, warehouse, location, unit, isLow };
    })
    .filter((r) => {
      if (!r.product) return false;
      if (warehouseFilter && r.warehouseId !== warehouseFilter) return false;
      if (lowStockOnly && !r.isLow) return false;
      if (search && !r.product.name.toLowerCase().includes(search.toLowerCase()) && !r.product.sku.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.product?.name ?? "").localeCompare(b.product?.name ?? ""));

  const lowCount = stock.filter((b) => {
    const p = state.products.find((pr) => pr.id === b.productId);
    return p && b.quantity < p.minStock;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Остатки на складах</h1>
          <p className="text-sm text-gray-500">Текущие остатки по всем позициям и местам хранения</p>
        </div>
        {lowCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            ⚠ {lowCount} позиций ниже минимального остатка
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по товару или артикулу..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Все склады</option>
          {state.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="rounded" />
          Только критические остатки
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Товар</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Артикул</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Склад</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Место хранения</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Кол-во</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Мин. остаток</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Нет данных</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className={`hover:bg-gray-50 ${r.isLow ? "bg-red-50" : ""}`}>
                <td className="px-4 py-3 font-medium">{r.product?.name}</td>
                <td className="px-4 py-3 font-mono text-gray-500">{r.product?.sku}</td>
                <td className="px-4 py-3 text-gray-600">{r.warehouse?.name}</td>
                <td className="px-4 py-3 text-gray-600">{r.location?.name ?? r.storageLocationId}</td>
                <td className={`px-4 py-3 text-right font-semibold ${r.isLow ? "text-red-600" : "text-green-700"}`}>
                  {r.quantity} {r.unit?.symbol}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{r.product?.minStock} {r.unit?.symbol}</td>
                <td className="px-4 py-3 text-center">
                  {r.isLow
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Критично</span>
                    : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Норма</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
