"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/lib/demo/store";

export default function DemoWarehouses() {
  const { state, dispatch } = useDemo();
  const [name, setName] = useState(""); const [address, setAddress] = useState(""); const [open, setOpen] = useState(false);

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: "CREATE_WAREHOUSE", name: name.trim(), address: address.trim() || undefined });
    dispatch({ type: "NOTIFY", message: "Склад создан", kind: "success" });
    setName(""); setAddress(""); setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Склады</h1><p className="text-sm text-gray-500">Справочник складов</p></div>
        <button onClick={() => setOpen(!open)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">+ Создать склад</button>
      </div>

      {open && (
        <form onSubmit={create} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-end max-w-xl">
          <div className="flex-1"><label className="text-xs font-medium text-gray-700 block mb-1">Название *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inp} required /></div>
          <div className="flex-1"><label className="text-xs font-medium text-gray-700 block mb-1">Адрес</label><input value={address} onChange={(e) => setAddress(e.target.value)} className={inp} /></div>
          <button type="submit" className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg">Создать</button>
          <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 border border-gray-300 text-gray-600 text-xs rounded-lg">✕</button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-medium text-gray-500">Название</th><th className="px-4 py-3 text-left font-medium text-gray-500">Адрес</th><th className="px-4 py-3 text-right font-medium text-gray-500">Мест хранения</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {state.warehouses.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{w.name}</td>
                <td className="px-4 py-3 text-gray-600">{w.address ?? "—"}</td>
                <td className="px-4 py-3 text-right">{state.locations.filter((l) => l.warehouseId === w.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const inp = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
