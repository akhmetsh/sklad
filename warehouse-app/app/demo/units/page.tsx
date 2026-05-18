"use client";

import { useState } from "react";
import { useDemo } from "@/lib/demo/store";

export default function DemoUnits() {
  const { state, dispatch } = useDemo();
  const [name, setName] = useState(""); const [symbol, setSymbol] = useState(""); const [open, setOpen] = useState(false);

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !symbol.trim()) return;
    dispatch({ type: "CREATE_UNIT", name: name.trim(), symbol: symbol.trim() });
    dispatch({ type: "NOTIFY", message: "Единица измерения создана", kind: "success" });
    setName(""); setSymbol(""); setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Единицы измерения</h1><p className="text-sm text-gray-500">Справочник единиц</p></div>
        <button onClick={() => setOpen(!open)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">+ Создать</button>
      </div>

      {open && (
        <form onSubmit={create} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-end max-w-md">
          <div className="flex-1"><label className="text-xs font-medium text-gray-700 block mb-1">Название (напр. Штука) *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inp} required /></div>
          <div className="w-28"><label className="text-xs font-medium text-gray-700 block mb-1">Обозначение *</label><input value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inp} required /></div>
          <button type="submit" className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg">Создать</button>
          <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 border border-gray-300 text-gray-600 text-xs rounded-lg">✕</button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-medium text-gray-500">Название</th><th className="px-4 py-3 text-left font-medium text-gray-500">Обозначение</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {state.units.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 font-mono">{u.symbol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const inp = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
