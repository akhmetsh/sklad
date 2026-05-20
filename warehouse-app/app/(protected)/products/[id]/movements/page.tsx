import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getMovementHistory } from "@/lib/services/stock.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovementBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { t } from "@/lib/i18n";

const DOC_HREF: Record<string, string> = {
  ReceiptDocument: "/documents/receipts/",
  IssueDocument: "/documents/issues/",
  TransferDocument: "/documents/transfers/",
};

export default async function ProductMovementsPage({ params }: { params: { id: string } }) {
  await getSession();

  const [product, movements] = await Promise.all([
    db.product.findUnique({
      where: { id: params.id },
      include: { unit: true },
    }),
    getMovementHistory({ productId: params.id, limit: 500 }),
  ]);

  if (!product) notFound();

  // Source document numbers (lookup in one query per doc type)
  const receiptIds = movements.filter((m) => m.sourceDocumentType === "ReceiptDocument").map((m) => m.sourceDocumentId);
  const issueIds = movements.filter((m) => m.sourceDocumentType === "IssueDocument").map((m) => m.sourceDocumentId);
  const transferIds = movements.filter((m) => m.sourceDocumentType === "TransferDocument").map((m) => m.sourceDocumentId);

  const [receipts, issues, transfers] = await Promise.all([
    receiptIds.length ? db.receiptDocument.findMany({ where: { id: { in: receiptIds } }, select: { id: true, documentNumber: true } }) : [],
    issueIds.length ? db.issueDocument.findMany({ where: { id: { in: issueIds } }, select: { id: true, documentNumber: true } }) : [],
    transferIds.length ? db.transferDocument.findMany({ where: { id: { in: transferIds } }, select: { id: true, documentNumber: true } }) : [],
  ]);

  const docNumber = new Map<string, string>();
  for (const d of receipts) docNumber.set(d.id, d.documentNumber);
  for (const d of issues) docNumber.set(d.id, d.documentNumber);
  for (const d of transfers) docNumber.set(d.id, d.documentNumber);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${t.movements.title}: ${product.name}`}
        description={product.sku}
        backHref={`/products/${product.id}`}
      />

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {movements.length === 0 ? (
          <EmptyState title={t.movements.empty} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto scrollbar-thin">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.movements.columns.date}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.movements.columns.type}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.movements.columns.warehouse}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.movements.columns.location}</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">{t.movements.columns.quantity}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.movements.columns.source}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t.movements.columns.user}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movements.map((m) => {
                    const qty = Number(m.quantityChange);
                    const number = docNumber.get(m.sourceDocumentId);
                    const href = DOC_HREF[m.sourceDocumentType];
                    return (
                      <tr key={m.id}>
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs font-mono">{formatDateTime(m.createdAt)}</td>
                        <td className="px-4 py-2.5"><MovementBadge type={m.movementType} /></td>
                        <td className="px-4 py-2.5 text-gray-700">{m.warehouse.name}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          <span className="font-mono">{m.storageLocation.code}</span> — {m.storageLocation.name}
                        </td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-mono font-semibold ${qty < 0 ? "text-red-600" : "text-green-700"}`}>
                          {qty > 0 ? "+" : ""}{formatQuantity(qty, product.unit.symbol)}
                        </td>
                        <td className="px-4 py-2.5">
                          {number && href ? (
                            <Link href={`${href}${m.sourceDocumentId}`} className="font-mono text-xs text-brand-600 hover:underline">
                              {number}
                            </Link>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{m.createdBy?.name ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-gray-100">
              {movements.map((m) => {
                const qty = Number(m.quantityChange);
                const number = docNumber.get(m.sourceDocumentId);
                const href = DOC_HREF[m.sourceDocumentType];
                return (
                  <li key={m.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <MovementBadge type={m.movementType} />
                      <span className={`text-sm font-mono font-semibold tabular-nums ${qty < 0 ? "text-red-600" : "text-green-700"}`}>
                        {qty > 0 ? "+" : ""}{formatQuantity(qty, product.unit.symbol)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {m.warehouse.name} · <span className="font-mono">{m.storageLocation.code}</span>
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-mono">{formatDateTime(m.createdAt)}</span>
                      {number && href && (
                        <Link href={`${href}${m.sourceDocumentId}`} className="font-mono text-brand-600 hover:underline">
                          {number}
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
