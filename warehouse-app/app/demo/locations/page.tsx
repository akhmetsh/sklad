"use client";

import { useState } from "react";
import { useDemo } from "@/lib/demo/store";

export default function DemoLocations() {
  const { state, dispatch } = useDemo();
  const [f, setF] = useState({ warehouseId: "", code: "", name: "" });
  const [open, setOpen] = useState(false);

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!f.warehouseId || !f.code || !f.name) return;
    dispatch({ type: "CREATE_LOCATION", warehouseId: f.warehouseId, code: f.code.trim(), name: f.name.trim() });
    dispatch({ type: "NOTIFY", message: "Место хранения создано", kind: "success" });
    setF({ warehouseId: "", code: "", name: "" }); setOpen(false);
  }

  const locations = [...state.locations].sort((a, b) => {
    const wa = state.warehouses.find((w) => w.id === a.warehouseId)?.name ?? "";
    const wb = state.warehouses.find((w) => w.id === b.warehouseId)?.name ?? "";
    return wa.localeCompare(wb) || a.code.localeCompare(b.code);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Места хранения</h1><p className="text-sm text-gray-500">Зоны, полки и ячейки на складах</p></div>
        <button onClick={() => setOpen(!open)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">+ Создать место</button>
      </div>

      {open && (
        <form onSubmit={create} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-end flex-wrap max-w-2xl">
          <div className="w-48">
            <label className="text-xs font-medium text-gray-700 block mb-1">Склад *</label>
            <select value={f.warehouseId} onChange={(e) => setF((x) => ({ ...x, warehouseId: e.target.value }))} className={inp} required>
              <option value="">— выберите —</option>
              {state.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="w-28"><label className="text-xs font-medium text-gray-700 block mb-1">Код (A-01) *</label><input value={f.code} onChange={(e) => setF((x) => ({ ...x, code: e.target.value }))} className={inp} required /></div>
          <div className="flex-1"><label className="text-xs font-medium text-gray-700 block mb-1">Название *</label><input value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} className={inp} required /></div>
          <button type="submit" className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg">Создать</button>
          <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 border border-gray-300 text-gray-600 text-xs rounded-lg">✕</button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-medium text-gray-500">Код</th><th className="px-4 py-3 text-left font-medium text-gray-500">Название</th><th className="px-4 py-3 text-left font-medium text-gray-500">Склад</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {locations.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium">{l.code}</td>
                <td className="px-4 py-3">{l.name}</td>
                <td className="px-4 py-3 text-gray-600">{state.warehouses.find((w) => w.id === l.warehouseId)?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const inp = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
