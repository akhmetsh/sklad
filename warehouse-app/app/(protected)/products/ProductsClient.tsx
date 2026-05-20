"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StockStatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatQuantity } from "@/lib/format";
import { t } from "@/lib/i18n";

interface Product {
  id: string; name: string; sku: string; barcode: string | null;
  imageUrl: string | null;
  categoryId: string; categoryName: string;
  unitId: string; unitSymbol: string;
  minStock: number; stockTotal: number;
}

interface CategoryOption { id: string; name: string; }

export function ProductsClient({ initial, categories }: { initial: Product[]; categories: CategoryOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Product[]>(initial);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() => {
    let result = items;
    if (categoryFilter) result = result.filter((p) => p.categoryId === categoryFilter);
    if (lowStockOnly) result = result.filter((p) => p.stockTotal < p.minStock);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode ?? "").toLowerCase().includes(q));
    return result;
  }, [items, search, categoryFilter, lowStockOnly]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/products/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); toast.error(b.error ?? t.errors.generic); return; }
      setItems((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success(t.common.delete);
      setDeleting(null);
      router.refresh();
    } catch { toast.error(t.errors.network); }
    finally { setDeleteLoading(false); }
  }

  const columns: Column<Product>[] = [
    {
      key: "name", header: t.products.fields.name, mobilePrimary: true,
      cell: (p) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex-shrink-0">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <Link href={`/products/${p.id}`} className="font-medium text-gray-900 hover:text-brand-600 hover:underline truncate">
            {p.name}
          </Link>
        </div>
      ),
    },
    { key: "sku", header: t.products.fields.sku, cell: (p) => <span className="font-mono text-gray-600 text-xs">{p.sku}</span> },
    { key: "category", header: t.products.fields.category, cell: (p) => <span className="text-gray-600">{p.categoryName}</span> },
    {
      key: "stock", header: t.nav.stock, align: "right",
      cell: (p) => {
        const isLow = p.stockTotal < p.minStock;
        return (
          <span className={`tabular-nums font-medium ${p.stockTotal === 0 ? "text-gray-400" : isLow ? "text-red-600" : "text-green-700"}`}>
            {formatQuantity(p.stockTotal, p.unitSymbol)}
          </span>
        );
      },
    },
    {
      key: "status", header: t.common.status, align: "center", hideOnMobile: true,
      cell: (p) => <StockStatusBadge quantity={p.stockTotal} minStock={p.minStock} />,
    },
    {
      key: "actions", header: "", align: "right", hideOnMobile: true,
      cell: (p) => (
        <button onClick={() => setDeleting(p)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label={t.common.delete}>
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t.products.title} description={t.products.subtitle}>
        <Link href="/products/new">
          <Button><Plus className="w-4 h-4" /> {t.products.create}</Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.products.filters.search} className="pl-9" />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-56">
          <option value="">{t.products.filters.allCategories}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <label className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500"
          />
          {t.products.filters.lowStockOnly}
        </label>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        onRowClick={(p) => router.push(`/products/${p.id}`)}
        empty={<EmptyState
          title={t.products.empty}
          action={<Link href="/products/new"><Button><Plus className="w-4 h-4" /> {t.products.create}</Button></Link>}
        />}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={`${t.common.delete}: ${deleting?.name ?? ""}`}
        destructive
        loading={deleteLoading}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
