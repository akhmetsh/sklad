"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo/store";
import { computeStock } from "@/lib/demo/types";

export default function DemoProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { state, dispatch } = useDemo();
  const product = state.products.find((p) => p.id === params.id);

  const [form, setForm] = useState(product ? { name: product.name, sku: product.sku, categoryId: product.categoryId, unitId: product.unitId, minStock: String(product.minStock), description: product.description ?? "", barcode: product.barcode ?? "" } : null);
  const [error, setError] = useState("");

  if (!product || !form) return <div className="p-8 text-gray-400">Товар не найден</div>;

  function set(k: string, v: string) { setForm((f) => f ? { ...f, [k]: v } : f); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !form.name || !form.sku || !form.categoryId || !form.unitId) { setError("Заполните обязательные поля"); return; }
    dispatch({ type: "UPDATE_PRODUCT", p: { ...product!, name: form.name, sku: form.sku, categoryId: form.categoryId, unitId: form.unitId, minStock: parseFloat(form.minStock) || 0, description: form.description || undefined, barcode: form.barcode || undefined } });
    dispatch({ type: "NOTIFY", message: "Товар сохранён", kind: "success" });
    router.push("/demo/products");
  }

  const stock = computeStock(state.movements).filter((b) => b.productId === product.id);
  const unit = state.units.find((u) => u.id === product.unitId);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button onClick={() => router.back()} className="text-xs text-blue-600 hover:underline mb-1 block">← Назад к товарам</button>
        <h1 className="text-xl font-semibold">{product.name}</h1>
      </div>

      {stock.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Текущие остатки</p>
          <div className="space-y-1">
            {stock.map((b) => {
              const wh = state.warehouses.find((w) => w.id === b.warehouseId);
              const loc = state.locations.find((l) => l.id === b.storageLocationId);
              return (
                <div key={`${b.warehouseId}-${b.storageLocationId}`} className="flex justify-between text-sm">
                  <span className="text-gray-600">{wh?.name} / {loc?.name}</span>
                  <span className={`font-semibold ${b.quantity < product.minStock ? "text-red-600" : "text-green-700"}`}>
                    {b.quantity} {unit?.symbol}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <F label="Название *"><input value={form.name} onChange={(e) => set("name", e.target.value)} className={inp} required /></F>
          <F label="Артикул *"><input value={form.sku} onChange={(e) => set("sku", e.target.value)} className={inp} required /></F>
          <F label="Категория *">
            <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inp}>
              <option value="">— выберите —</option>
              {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </F>
          <F label="Единица измерения *">
            <select value={form.unitId} onChange={(e) => set("unitId", e.target.value)} className={inp}>
              <option value="">— выберите —</option>
              {state.units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
            </select>
          </F>
          <F label="Мин. остаток"><input type="number" value={form.minStock} onChange={(e) => set("minStock", e.target.value)} className={inp} min="0" /></F>
          <F label="Штрихкод"><input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} className={inp} /></F>
          <F label="Описание" className="col-span-2"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={inp} /></F>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Сохранить</button>
          <button type="button" onClick={() => router.back()} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Отмена</button>
        </div>
      </form>
    </div>
  );
}

const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
function F({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
}
