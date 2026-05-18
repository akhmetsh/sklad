import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDocumentButton } from "@/components/documents/ConfirmDocumentButton";

export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  await getSession();

  const doc = await db.issueDocument.findUnique({
    where: { id: params.id },
    include: {
      warehouse: true,
      createdBy: { select: { name: true } },
      items: {
        include: {
          product: { include: { unit: true } },
          storageLocation: true,
        },
      },
    },
  });

  if (!doc) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={`Выдача ${doc.documentNumber}`} backHref="/documents/issues">
        {doc.status === "DRAFT" && (
          <ConfirmDocumentButton docId={doc.id} type="issue" label="Подтвердить выдачу" />
        )}
      </PageHeader>

      <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-2 gap-4 text-sm">
        <Field label="Статус"><StatusBadge type="document" value={doc.status} /></Field>
        <Field label="Дата">{new Date(doc.date).toLocaleDateString("ru-RU")}</Field>
        <Field label="Получатель">{doc.recipientName}</Field>
        <Field label="Склад">{doc.warehouse.name}</Field>
        <Field label="Создал">{doc.createdBy.name}</Field>
        {doc.comment && <Field label="Комментарий" className="col-span-2">{doc.comment}</Field>}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 font-medium text-sm">Позиции</div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Товар</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Место хранения</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Количество</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {doc.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2">{item.product.name}</td>
                <td className="px-4 py-2">{item.storageLocation.name}</td>
                <td className="px-4 py-2 text-right">
                  {item.quantity.toString()} {item.product.unit.symbol}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="font-medium">{children}</div>
    </div>
  );
}
