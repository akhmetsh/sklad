"use client";

import { useMemo } from "react";
import { Download, Package, AlertTriangle, MapPin, Boxes } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StockStatusBadge } from "@/components/ui/StatusBadge";
import { formatQuantity, formatDate } from "@/lib/format";
import { downloadCSV, toCSV } from "@/lib/csv";
import { t } from "@/lib/i18n";

interface StockRow {
  productId: string; productName: string; productSku: string; categoryName: string;
  warehouseId: string; warehouseName: string;
  locationCode: string; locationName: string;
  quantity: number; minStock: number; unitSymbol: string;
}

interface Warehouse { id: string; name: string; address: string | null; }

export function StockReportClient({ rows, warehouses }: { rows: StockRow[]; warehouses: Warehouse[] }) {
  const perProduct = useMemo(() => {
    const map = new Map<string, { row: StockRow; total: number; locations: number }>();
    for (const r of rows) {
      const existing = map.get(r.productId);
      if (existing) {
        existing.total += r.quantity;
        existing.locations += 1;
      } else {
        map.set(r.productId, { row: r, total: r.quantity, locations: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.row.productName.localeCompare(b.row.productName));
  }, [rows]);

  const totalProducts = perProduct.length;
  const totalLocationsInUse = rows.length;
  const lowStock = perProduct.filter((p) => p.total < p.row.minStock).length;
  const outOfStock = perProduct.filter((p) => p.total === 0).length;

  function handleExport() {
    const headers = [
      t.reports.stock.columns.product,
      "SKU",
      t.reports.stock.columns.category,
      t.stock.columns.warehouse,
      t.stock.columns.location,
      t.stock.columns.quantity,
      t.stock.columns.minStock,
      t.common.status,
    ];
    const csvRows = rows.map((r) => [
      r.productName,
      r.productSku,
      r.categoryName,
      r.warehouseName,
      `${r.locationCode} — ${r.locationName}`,
      `${r.quantity} ${r.unitSymbol}`.trim(),
      `${r.minStock} ${r.unitSymbol}`.trim(),
      r.quantity === 0 ? t.status.empty : r.quantity < r.minStock ? t.status.low : t.status.normal,
    ]);
    const csv = toCSV(headers, csvRows);
    downloadCSV(`stock-${formatDate(new Date()).replace(/\./g, "-")}.csv`, csv);
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t.reports.stock.title} description={t.reports.stock.subtitle}>
        <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="w-4 h-4" /> CSV
        </Button>
      </PageHeader>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Package} label={t.reports.stock.stats.totalProducts} value={totalProducts} tone="blue" />
        <StatCard icon={MapPin} label={t.reports.stock.stats.totalLocations} value={totalLocationsInUse} tone="gray" />
        <StatCard icon={AlertTriangle} label={t.reports.stock.stats.lowStock} value={lowStock} tone="red" />
        <StatCard icon={Boxes} label={t.reports.stock.stats.outOfStock} value={outOfStock} tone="orange" />
      </div>

      {/* Per-product summary */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">{t.reports.stock.productSummary}</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.reports.stock.columns.product}</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.reports.stock.columns.category}</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-500">{t.reports.stock.columns.totalQuantity}</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-500">{t.reports.stock.columns.minStock}</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-500">{t.reports.stock.columns.locationsCount}</th>
                <th className="px-4 py-2.5 text-center font-medium text-gray-500">{t.common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {perProduct.map(({ row, total, locations }) => {
                const isLow = total < row.minStock;
                return (
                  <tr key={row.productId} className={isLow ? "bg-red-50" : ""}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{row.productName}</div>
                      <div className="text-xs text-gray-400 font-mono">{row.productSku}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.categoryName}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-medium ${total === 0 ? "text-gray-400" : isLow ? "text-red-600" : "text-green-700"}`}>
                      {formatQuantity(total, row.unitSymbol)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 tabular-nums">{formatQuantity(row.minStock, row.unitSymbol)}</td>
                    <td className="px-4 py-3 text-right text-gray-500 tabular-nums">{locations}</td>
                    <td className="px-4 py-3 text-center"><StockStatusBadge quantity={total} minStock={row.minStock} /></td>
                  </tr>
                );
              })}
              {perProduct.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t.stock.empty}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="md:hidden divide-y divide-gray-100">
          {perProduct.map(({ row, total, locations }) => {
            const isLow = total < row.minStock;
            return (
              <li key={row.productId} className={`p-4 space-y-1.5 ${isLow ? "bg-red-50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{row.productName}</p>
                    <p className="text-xs text-gray-400 font-mono">{row.productSku} · {row.categoryName}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums whitespace-nowrap ${total === 0 ? "text-gray-400" : isLow ? "text-red-600" : "text-green-700"}`}>
                    {formatQuantity(total, row.unitSymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{locations} {t.reports.stock.storageLocations} · min {formatQuantity(row.minStock, row.unitSymbol)}</span>
                  <StockStatusBadge quantity={total} minStock={row.minStock} />
                </div>
              </li>
            );
          })}
          {perProduct.length === 0 && <li className="p-8 text-center text-gray-400 text-sm">{t.stock.empty}</li>}
        </ul>
      </div>

      {/* Per-warehouse breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">{t.reports.stock.warehouseBreakdown}</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {warehouses.map((wh) => {
            const whRows = rows.filter((r) => r.warehouseId === wh.id);
            const uniqueProducts = new Set(whRows.map((r) => r.productId)).size;
            return (
              <li key={wh.id} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{wh.name}</p>
                  {wh.address && <p className="text-xs text-gray-500 truncate">{wh.address}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-700 tabular-nums">{uniqueProducts} {t.reports.stock.itemNames}</p>
                  <p className="text-xs text-gray-400 tabular-nums">{whRows.length} {t.reports.stock.storageLocations}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const toneStyles = {
  blue: "bg-blue-50 text-blue-700",
  gray: "bg-gray-50 text-gray-700",
  red: "bg-red-50 text-red-700",
  orange: "bg-orange-50 text-orange-700",
} as const;

function StatCard({
  icon: Icon, label, value, tone,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: keyof typeof toneStyles }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${toneStyles[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-tight tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
    </div>
  );
}
