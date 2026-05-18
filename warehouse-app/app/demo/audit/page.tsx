"use client";

import { useDemo } from "@/lib/demo/store";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Создание",
  UPDATE: "Изменение",
  CONFIRM: "Подтверждение",
  DELETE: "Удаление",
};

const ENTITY_LABELS: Record<string, string> = {
  Product: "Товар",
  Category: "Категория",
  Unit: "Ед. изм.",
  Warehouse: "Склад",
  StorageLocation: "Место хранения",
  Supplier: "Поставщик",
  ReceiptDocument: "Поступление",
  IssueDocument: "Выдача",
  TransferDocument: "Перемещение",
  User: "Пользователь",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DemoAudit() {
  const { state } = useDemo();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Журнал действий</h1>
        <p className="text-sm text-gray-500">История изменений в системе</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Дата</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Пользователь</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Действие</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Объект</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Детали</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.auditLog.map((entry) => {
              const user = state.users.find((u) => u.id === entry.userId);
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">{user?.name ?? entry.userId}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      entry.action === "CONFIRM" ? "bg-green-100 text-green-700"
                      : entry.action === "CREATE" ? "bg-blue-100 text-blue-700"
                      : entry.action === "DELETE" ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                    }`}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ENTITY_LABELS[entry.entityType] ?? entry.entityType}</td>
                  <td className="px-4 py-3 text-gray-500">{entry.details ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
