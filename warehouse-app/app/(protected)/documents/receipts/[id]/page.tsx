import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocumentStatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDocumentButton } from "@/components/documents/ConfirmDocumentButton";
import { CancelDocumentButton } from "@/components/documents/CancelDocumentButton";
import { PrintButton } from "@/components/documents/PrintButton";
import { formatDate, formatDateTime, formatMoney, formatQuantity } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function ReceiptDetailPage({ params }: { params: { id: string } }) {
  await getSession();

  const doc = await db.receiptDocument.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
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

  const total = doc.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice ?? 0), 0);
  const hasPrices = doc.items.some((i) => i.unitPrice !== null);

  return (
    <div className="space-y-4 max-w-4xl">
      <PageHeader title={`${t.documents.receipts.detailTitle} ${doc.documentNumber}`} backHref="/documents/receipts">
        <PrintButton />
        {doc.status !== "CANCELLED" && (
          <CancelDocumentButton docId={doc.id} type="receipt" status={doc.status} />
        )}
        {doc.status === "DRAFT" && (
          <ConfirmDocumentButton docId={doc.id} type="receipt" />
        )}
      </PageHeader>

      {/* Status banner */}
      {doc.status === "CONFIRMED" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          {t.documents.receipts.confirmedMessage}
        </div>
      )}

      {/* Header info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.documents.common.requisites}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label={t.common.status}><DocumentStatusBadge status={doc.status} /></Field>
          <Field label={t.documents.common.date}>{formatDate(doc.date)}</Field>
          <Field label={t.documents.receipts.fields.supplier}>{doc.supplier.name}</Field>
          <Field label={t.documents.common.warehouse}>{doc.warehouse.name}</Field>
          <Field label={t.documents.common.createdAt}>{formatDateTime(doc.createdAt)}</Field>
          <Field label={t.audit.columns.user}>{doc.createdBy.name}</Field>
          {doc.comment && <Field label={t.documents.common.comment} className="sm:col-span-2">{doc.comment}</Field>}
        </dl>
      </div>

      {/* Items */}
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
                {hasPrices && <th className="px-4 py-2.5 text-right font-medium text-gray-500">{t.documents.receipts.fields.unitPrice}</th>}
                {hasPrices && <th className="px-4 py-2.5 text-right font-medium text-gray-500">{t.common.sum}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {doc.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.product.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{item.product.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="font-mono">{item.storageLocation.code}</span> — {item.storageLocation.name}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatQuantity(Number(item.quantity), item.product.unit.symbol)}
                  </td>
                  {hasPrices && (
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                      {item.unitPrice ? formatMoney(Number(item.unitPrice)) : "—"}
                    </td>
                  )}
                  {hasPrices && (
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {item.unitPrice ? formatMoney(Number(item.quantity) * Number(item.unitPrice)) : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {total > 0 && (
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={hasPrices ? 4 : 3} className="px-4 py-3 text-right font-medium text-gray-700">{t.common.total}:</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">{formatMoney(total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="md:hidden divide-y divide-gray-100">
          {doc.items.map((item) => (
            <li key={item.id} className="p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{item.product.sku}</p>
                </div>
                <span className="text-sm font-medium tabular-nums whitespace-nowrap">
                  {formatQuantity(Number(item.quantity), item.product.unit.symbol)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  <span className="font-mono">{item.storageLocation.code}</span> — {item.storageLocation.name}
                </span>
                {item.unitPrice && (
                  <span className="font-medium text-gray-700 tabular-nums">
                    {formatMoney(Number(item.quantity) * Number(item.unitPrice))}
                  </span>
                )}
              </div>
            </li>
          ))}
          {total > 0 && (
            <li className="p-4 bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{t.common.total}:</span>
              <span className="text-base font-bold text-gray-900 tabular-nums">{formatMoney(total)}</span>
            </li>
          )}
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
