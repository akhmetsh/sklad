import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function IssuesPage() {
  await getSession();

  const docs = await db.issueDocument.findMany({
    include: {
      warehouse: true,
      createdBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Выдачи" description="Документы выдачи товара">
        <Link href="/documents/issues/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + Создать
        </Link>
      </PageHeader>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">№ документа</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Дата</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Получатель</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Склад</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Строк</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {docs.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{d.documentNumber}</td>
                <td className="px-4 py-3">{new Date(d.date).toLocaleDateString("ru-RU")}</td>
                <td className="px-4 py-3">{d.recipientName}</td>
                <td className="px-4 py-3">{d.warehouse.name}</td>
                <td className="px-4 py-3 text-right">{d._count.items}</td>
                <td className="px-4 py-3"><StatusBadge type="document" value={d.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/documents/issues/${d.id}`} className="text-blue-600 hover:underline text-xs">Открыть</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
