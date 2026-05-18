"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo/store";
import { genId, today, now } from "@/lib/demo/types";
import type { DocItem } from "@/lib/demo/types";

interface ItemRow { productId: string; storageLocationId: string; quantity: string; unitPrice: string; }

export default function DemoReceiptNew() {
  const router = useRouter();
  const { state, dispatch } = useDemo();

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [date, setDate] = useState(today());
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ productId: "", storageLocationId: "", quantity: "", unitPrice: "" }]);
  const [error, setError] = useState("");

  const whLocations = state.locations.filter((l) => l.warehouseId === warehouseId);

  function setItem(i: number, k: keyof ItemRow, v: string) {
    setItems((rows) => rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  }

  function addItem() { setItems((r) => [...r, { productId: "", storageLocationId: "", quantity: "", unitPrice: "" }]); }
  function removeItem(i: number) { setItems((r) => r.filter((_, idx) => idx !== i)); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId || !warehouseId) { setError("Выберите поставщика и склад"); return; }
    if (items.some((r) => !r.productId || !r.storageLocationId || !r.quantity)) { setError("Заполните все строки товаров"); return; }

    const nextNum = `REC-${1000 + state.receipts.length + 1}`;
    const docItems: DocItem[] = items.map((r) => ({
      id: genId(), productId: r.productId, storageLocationId: r.storageLocationId,
      quantity: parseFloat(r.quantity), unitPrice: r.unitPrice ? parseFloat(r.unitPrice) : undefined,
    }));

    dispatch({
      type: "CREATE_RECEIPT",
      doc: { id: genId(), documentNumber: nextNum, supplierId, warehouseId, date, status: "DRAFT", comment: comment.trim() || undefined, createdById: "u-store", createdAt: now(), items: docItems },
    });
    dispatch({ type: "NOTIFY", message: `Документ ${nextNum} создан`, kind: "success" });
    router.push("/demo/documents/receipts");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button onClick={() => router.back()} className="text-xs text-blue-600 hover:underline mb-1 block">← Назад</button>
        <h1 className="text-xl font-semibold">Новое поступление</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Реквизиты документа</h2>
          <div className="grid grid-cols-2 gap-4">
            <F label="Поставщик *">
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inp} required>
                <option value="">— выберите —</option>
                {state.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </F>
            <F label="Склад *">
              <select value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setItems([{ productId: "", storageLocationId: "", quantity: "", unitPrice: "" }]); }} className={inp} required>
                <option value="">— выберите —</option>
                {state.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </F>
            <F label="Дата"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} required /></F>
            <F label="Комментарий"><input value={comment} onChange={(e) => setComment(e.target.value)} className={inp} /></F>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Товарные позиции</h2>
            <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline">+ Добавить строку</button>
          </div>
          <div className="space-y-2">
            {items.map((row, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  {i === 0 && <label className="text-xs text-gray-500 block mb-1">Товар *</label>}
                  <select value={row.productId} onChange={(e) => setItem(i, "productId", e.target.value)} className={inp} required>
                    <option value="">— товар —</option>
                    {state.products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="w-44">
                  {i === 0 && <label className="text-xs text-gray-500 block mb-1">Место хранения *</label>}
                  <select value={row.storageLocationId} onChange={(e) => setItem(i, "storageLocationId", e.target.value)} className={inp} required disabled={!warehouseId}>
                    <option value="">— место —</option>
                    {whLocations.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
                  </select>
                </div>
                <div className="w-24">
                  {i === 0 && <label className="text-xs text-gray-500 block mb-1">Кол-во *</label>}
                  <input type="number" min="0.001" step="any" value={row.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} className={inp} required placeholder="0" />
                </div>
                <div className="w-28">
                  {i === 0 && <label className="text-xs text-gray-500 block mb-1">Цена (₸)</label>}
                  <input type="number" min="0" step="any" value={row.unitPrice} onChange={(e) => setItem(i, "unitPrice", e.target.value)} className={inp} placeholder="0" />
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className={`pb-0.5 text-gray-400 hover:text-red-500 text-lg leading-none ${i === 0 ? "mt-5" : ""}`}>×</button>
                )}
              </div>
            ))}
          </div>
          {items.length > 0 && items.some((r) => r.quantity && r.unitPrice) && (
            <div className="text-right text-sm font-semibold text-gray-700 pt-2 border-t border-gray-100">
              Итого: {items.reduce((s, r) => s + (parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0), 0).toLocaleString("ru-RU")} ₸
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Создать черновик</button>
          <button type="button" onClick={() => router.back()} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Отмена</button>
        </div>
      </form>
    </div>
  );
}

const inp = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
}
