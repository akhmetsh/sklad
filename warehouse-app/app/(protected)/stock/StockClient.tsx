"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input, Select } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StockStatusBadge } from "@/components/ui/StatusBadge";
import { formatQuantity } from "@/lib/format";
import { t } from "@/lib/i18n";

interface StockRow {
  productId: string; productName: string; productSku: string; categoryId: string;
  warehouseId: string; warehouseName: string;
  locationCode: string; locationName: string;
  quantity: number; minStock: number; unitSymbol: string;
}

interface Option { id: string; name: string; }

export function StockClient({ initial, warehouses, categories }: { initial: StockRow[]; warehouses: Option[]; categories: Option[] }) {
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = initial;
    if (warehouseFilter) result = result.filter((r) => r.warehouseId === warehouseFilter);
    if (categoryFilter) result = result.filter((r) => r.categoryId === categoryFilter);
    if (lowStockOnly) result = result.filter((r) => r.quantity < r.minStock);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((r) =>
      r.productName.toLowerCase().includes(q) ||
      r.productSku.toLowerCase().includes(q));
    return result;
  }, [initial, search, warehouseFilter, categoryFilter, lowStockOnly]);

  const lowCount = useMemo(() => initial.filter((r) => r.quantity < r.minStock).length, [initial]);

  const columns: Column<StockRow>[] = [
    {
      key: "product", header: t.stock.columns.product, mobilePrimary: true,
      cell: (r) => (
        <div>
          <div className="font-medium text-gray-900">{r.productName}</div>
          <div className="text-xs text-gray-400 font-mono">{r.productSku}</div>
        </div>
      ),
    },
    { key: "warehouse", header: t.stock.columns.warehouse, cell: (r) => <span className="text-gray-600">{r.warehouseName}</span> },
    {
      key: "location", header: t.stock.columns.location,
      cell: (r) => <span className="text-gray-600"><span className="font-mono">{r.locationCode}</span> — {r.locationName}</span>,
    },
    {
      key: "qty", header: t.stock.columns.quantity, align: "right",
      cell: (r) => {
        const isLow = r.quantity < r.minStock;
        return (
          <span className={`font-mono font-semibold tabular-nums ${isLow ? "text-red-600" : "text-green-700"}`}>
            {formatQuantity(r.quantity, r.unitSymbol)}
          </span>
        );
      },
    },
    {
      key: "min", header: t.stock.columns.minStock, align: "right", hideOnMobile: true,
      cell: (r) => <span className="text-gray-500 tabular-nums">{formatQuantity(r.minStock, r.unitSymbol)}</span>,
    },
    {
      key: "status", header: t.common.status, align: "center", hideOnMobile: true,
      cell: (r) => <StockStatusBadge quantity={r.quantity} minStock={r.minStock} />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t.stock.title} description={t.stock.subtitle} />

      {lowCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700">{t.stock.lowStockAlert(lowCount)}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.stock.filters.search} className="pl-9" />
        </div>
        <Select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="sm:w-56">
          <option value="">{t.stock.filters.allWarehouses}</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-56">
          <option value="">{t.products.filters.allCategories}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <label className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500"
          />
          {t.stock.filters.lowStockOnly}
        </label>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => `${r.productId}-${r.warehouseId}-${r.locationCode}`}
        rowClassName={(r) => r.quantity < r.minStock ? "bg-red-50" : ""}
        empty={<EmptyState title={t.stock.empty} description={search || warehouseFilter || categoryFilter ? t.common.noData : undefined} />}
      />
    </div>
  );
}
