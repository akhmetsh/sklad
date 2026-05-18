import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AuditPage() {
  await requireRole(["ADMIN", "MANAGER"]);

  const logs = await db.auditLog.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Журнал действий" description="История ключевых операций пользователей" />

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Дата</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Пользователь</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Действие</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Объект</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("ru-RU")}
                </td>
                <td className="px-4 py-3 font-medium">{log.user.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3">{log.entityType}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
