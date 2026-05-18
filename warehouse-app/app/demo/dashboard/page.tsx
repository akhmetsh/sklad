"use client";

import Link from "next/link";
import { useDemo } from "@/lib/demo/store";
import { computeStock } from "@/lib/demo/types";

const movLabel: Record<string, string> = {
  RECEIPT: "Поступление", ISSUE: "Выдача", TRANSFER_OUT: "Перемещение (−)", TRANSFER_IN: "Перемещение (+)",
};
const movColor: Record<string, string> = {
  RECEIPT: "bg-green-100 text-green-700", ISSUE: "bg-orange-100 text-orange-700",
  TRANSFER_OUT: "bg-blue-100 text-blue-700", TRANSFER_IN: "bg-cyan-100 text-cyan-700",
};

export default function DemoDashboard() {
  const { state } = useDemo();
  const { products, receipts, issues, transfers, movements, warehouses } = state;
  const stock = computeStock(movements);
  const drafts = [...receipts, ...issues, ...transfers].filter((d) => d.status === "DRAFT").length;
  const lowStock = stock.filter((b) => {
    const p = products.find((x) => x.id === b.productId);
    return p && b.quantity < p.minStock;
  }).length;
  const recent = [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Дашборд</h1>
        <p className="text-sm text-gray-500 mt-0.5">Сводная информация по складу — 18 мая 2026</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Товаров в каталоге" value={products.filter((p) => p.isActive).length} color="blue" href="/demo/products" />
        <StatCard label="Активных складов" value={warehouses.filter((w) => w.isActive).length} color="indigo" href="/demo/warehouses" />
        <StatCard label="Черновых документов" value={drafts} color="yellow" href="/demo/documents/receipts" />
        <StatCard label="Дефицитных позиций" value={lowStock} color={lowStock > 0 ? "red" : "green"} href="/demo/stock" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900 text-sm">Последние движения</h2>
            <Link href="/demo/stock" className="text-xs text-blue-600 hover:underline">Все остатки →</Link>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Товар</th>
                <th className="text-left pb-2 font-medium">Тип</th>
                <th className="text-right pb-2 font-medium">Кол-во</th>
                <th className="text-left pb-2 font-medium pl-3">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map((m) => {
                const prod = products.find((p) => p.id === m.productId);
                return (
                  <tr key={m.id}>
                    <td className="py-2 font-medium">{prod?.name ?? "—"}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${movColor[m.movementType] ?? "bg-gray-100 text-gray-600"}`}>
                        {movLabel[m.movementType] ?? m.movementType}
                      </span>
                    </td>
                    <td className={`py-2 text-right font-mono font-semibold ${m.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}>
                      {m.quantityChange > 0 ? "+" : ""}{m.quantityChange}
                    </td>
                    <td className="py-2 text-gray-500 text-xs pl-3">{m.createdAt.slice(0, 10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <QuickLink href="/demo/documents/receipts/new" label="Оформить поступление" color="green" />
          <QuickLink href="/demo/documents/issues/new" label="Оформить выдачу" color="orange" />
          <QuickLink href="/demo/documents/transfers/new" label="Создать перемещение" color="blue" />
          <QuickLink href="/demo/reports/stock" label="Отчёт по остаткам" color="gray" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, href }: { label: string; value: number; color: string; href: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100", indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100", red: "bg-red-50 text-red-700 border-red-100",
    green: "bg-green-50 text-green-700 border-green-100",
  };
  return (
    <Link href={href} className={`block border rounded-lg p-4 hover:shadow-sm transition-shadow ${colors[color] ?? colors.blue}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </Link>
  );
}

function QuickLink({ href, label, color }: { href: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-600 hover:bg-green-700", orange: "bg-orange-500 hover:bg-orange-600",
    blue: "bg-blue-600 hover:bg-blue-700", gray: "bg-gray-600 hover:bg-gray-700",
  };
  return (
    <Link href={href} className={`block w-full text-center text-sm text-white font-medium py-2.5 rounded-lg transition-colors ${colors[color]}`}>
      {label}
    </Link>
  );
}
