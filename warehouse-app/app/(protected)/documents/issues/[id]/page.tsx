import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getStockBalance } from "@/lib/services/stock.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocumentStatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDocumentButton } from "@/components/documents/ConfirmDocumentButton";
import { CancelDocumentButton } from "@/components/documents/CancelDocumentButton";
import { PrintButton } from "@/components/documents/PrintButton";
import { formatDate, formatDateTime, formatQuantity } from "@/lib/format";
import { t } from "@/lib/i18n";

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

  // For DRAFT, show available stock per row to help user understand if confirm will succeed
  const showAvailability = doc.status === "DRAFT";
  const availability: Record<string, number> = {};
  if (showAvailability) {
    for (const item of doc.items) {
      const bal = await getStockBalance(item.productId, doc.warehouseId, item.storageLocationId);
      availability[item.id] = Number(bal);
    }
  }
  const allSufficient = doc.items.every((i) => availability[i.id] >= Number(i.quantity));

  return (
    <div className="space-y-4 max-w-4xl">
      <PageHeader title={`${t.documents.issues.detailTitle} ${doc.documentNumber}`} backHref="/documents/issues">
        <PrintButton />
        {doc.status !== "CANCELLED" && (
          <CancelDocumentButton docId={doc.id} type="issue" status={doc.status} />
        )}
        {doc.status === "DRAFT" && allSufficient && (
          <ConfirmDocumentButton docId={doc.id} type="issue" />
        )}
      </PageHeader>

      {doc.status === "CONFIRMED" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          {t.documents.issues.confirmedMessage}
        </div>
      )}

      {doc.status === "DRAFT" && !allSufficient && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-700">{t.documents.common.insufficientStock}</p>
          <p className="text-xs text-red-600 mt-0.5">{t.documents.common.replenishStock}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.documents.common.requisites}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label={t.common.status}><DocumentStatusBadge status={doc.status} /></Field>
          <Field label={t.documents.common.date}>{formatDate(doc.date)}</Field>
          <Field label={t.documents.issues.fields.recipient}>{doc.recipientName}</Field>
          <Field label={t.documents.common.warehouse}>{doc.warehouse.name}</Field>
          <Field label={t.documents.common.createdAt}>{formatDateTime(doc.createdAt)}</Field>
          <Field label={t.audit.columns.user}>{doc.createdBy.name}</Field>
          {doc.comment && <Field label={t.documents.common.comment} className="sm:col-span-2">{doc.comment}</Field>}
        </dl>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">{t.documents.common.items}</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.documents.common.product}</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.documents.common.location}</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-500">{t.common.quantity}</th>
                {showAvailability && <th className="px-4 py-2.5 text-right font-medium text-gray-500">{t.documents.common.available}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {doc.items.map((item) => {
                const required = Number(item.quantity);
                const avail = availability[item.id];
                const insufficient = showAvailability && avail < required;
                return (
                  <tr key={item.id} className={insufficient ? "bg-red-50" : ""}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.product.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.product.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="font-mono">{item.storageLocation.code}</span> — {item.storageLocation.name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatQuantity(required, item.product.unit.symbol)}
                    </td>
                    {showAvailability && (
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${insufficient ? "text-red-600" : "text-green-700"}`}>
                        {formatQuantity(avail, item.product.unit.symbol)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="md:hidden divide-y divide-gray-100">
          {doc.items.map((item) => {
            const required = Number(item.quantity);
            const avail = availability[item.id];
            const insufficient = showAvailability && avail < required;
            return (
              <li key={item.id} className={`p-4 space-y-1.5 ${insufficient ? "bg-red-50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.product.sku}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums whitespace-nowrap">
                    {formatQuantity(required, item.product.unit.symbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    <span className="font-mono">{item.storageLocation.code}</span> — {item.storageLocation.name}
                  </span>
                  {showAvailability && (
                    <span className={`tabular-nums font-medium ${insufficient ? "text-red-600" : "text-green-700"}`}>
                      {t.documents.common.available}: {formatQuantity(avail, item.product.unit.symbol)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
      <dd className="font-medium text-gray-900">{children}</dd>
    </div>
  );
}
