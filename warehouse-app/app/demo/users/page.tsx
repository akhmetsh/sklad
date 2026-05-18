"use client";

import Link from "next/link";
import { useDemo } from "@/lib/demo/store";

const ROLE_LABELS: Record<string, string> = { ADMIN: "Администратор", STOREKEEPER: "Кладовщик", MANAGER: "Менеджер" };
const ROLE_COLORS: Record<string, string> = { ADMIN: "bg-purple-100 text-purple-700", STOREKEEPER: "bg-blue-100 text-blue-700", MANAGER: "bg-green-100 text-green-700" };

export default function DemoUsers() {
  const { state } = useDemo();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Пользователи</h1><p className="text-sm text-gray-500">Управление доступом</p></div>
        <Link href="/demo/users/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">+ Добавить пользователя</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Имя</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Роль</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Добавлен</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.isActive ? "Активен" : "Отключён"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.createdAt.split("T")[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
