"use client";

import Link from "next/link";
import { useDemo } from "@/lib/demo/store";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Черновик", cls: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "Проведён", cls: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Отменён", cls: "bg-gray-100 text-gray-500" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

export default function DemoReceipts() {
  const { state } = useDemo();
  const receipts = [...state.receipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Поступления</h1><p className="text-sm text-gray-500">Документы приёмки товаров</p></div>
        <Link href="/demo/documents/receipts/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">+ Новое поступление</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Номер</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Дата</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Поставщик</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Склад</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Позиций</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Сумма</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {receipts.map((r) => {
              const supplier = state.suppliers.find((s) => s.id === r.supplierId);
              const warehouse = state.warehouses.find((w) => w.id === r.warehouseId);
              const total = r.items.reduce((s, i) => s + i.quantity * (i.unitPrice ?? 0), 0);
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/demo/documents/receipts/${r.id}`} className="font-mono font-medium text-blue-600 hover:underline">{r.documentNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.date}</td>
                  <td className="px-4 py-3">{supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{warehouse?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{r.items.length}</td>
                  <td className="px-4 py-3 text-right font-medium">{total > 0 ? `${total.toLocaleString("ru-RU")} ₸` : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
