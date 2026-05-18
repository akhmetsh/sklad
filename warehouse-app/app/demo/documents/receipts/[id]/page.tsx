"use client";

import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo/store";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Черновик", cls: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "Проведён", cls: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Отменён", cls: "bg-gray-100 text-gray-500" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500" };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-medium ${cls}`}>{label}</span>;
}

export default function DemoReceiptDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { state, dispatch } = useDemo();
  const doc = state.receipts.find((r) => r.id === params.id);

  if (!doc) return <div className="p-8 text-gray-400">Документ не найден</div>;

  const supplier = state.suppliers.find((s) => s.id === doc.supplierId);
  const warehouse = state.warehouses.find((w) => w.id === doc.warehouseId);
  const total = doc.items.reduce((s, i) => s + i.quantity * (i.unitPrice ?? 0), 0);

  function confirm() {
    dispatch({ type: "CONFIRM_RECEIPT", id: doc!.id });
    dispatch({ type: "NOTIFY", message: `Документ ${doc!.documentNumber} проведён`, kind: "success" });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button onClick={() => router.back()} className="text-xs text-blue-600 hover:underline mb-1 block">← Назад к поступлениям</button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold font-mono">{doc.documentNumber}</h1>
          <StatusBadge status={doc.status} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Реквизиты</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><dt className="text-gray-500">Поставщик</dt><dd className="font-medium">{supplier?.name ?? "—"}</dd></div>
          <div><dt className="text-gray-500">Склад</dt><dd className="font-medium">{warehouse?.name ?? "—"}</dd></div>
          <div><dt className="text-gray-500">Дата</dt><dd>{doc.date}</dd></div>
          <div><dt className="text-gray-500">Создан</dt><dd>{new Date(doc.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</dd></div>
          {doc.comment && <div className="col-span-2"><dt className="text-gray-500">Комментарий</dt><dd>{doc.comment}</dd></div>}
        </dl>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Товарные позиции</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead><tr>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Товар</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Место хранения</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Кол-во</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Цена</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Сумма</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {doc.items.map((item) => {
              const product = state.products.find((p) => p.id === item.productId);
              const unit = state.units.find((u) => u.id === product?.unitId);
              const location = state.locations.find((l) => l.id === item.storageLocationId);
              return (
                <tr key={item.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{product?.name ?? item.productId}</div>
                    <div className="text-xs text-gray-400">{product?.sku}</div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{location?.name ?? item.storageLocationId}</td>
                  <td className="px-4 py-2.5 text-right">{item.quantity} {unit?.symbol}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{item.unitPrice ? `${item.unitPrice.toLocaleString("ru-RU")} ₸` : "—"}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{item.unitPrice ? `${(item.quantity * item.unitPrice).toLocaleString("ru-RU")} ₸` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
          {total > 0 && (
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={4} className="px-4 py-2.5 text-right font-semibold text-gray-700">Итого:</td>
                <td className="px-4 py-2.5 text-right font-bold text-gray-900">{total.toLocaleString("ru-RU")} ₸</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {doc.status === "DRAFT" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">Черновик не проведён</p>
            <p className="text-xs text-yellow-600 mt-0.5">Нажмите «Провести», чтобы оприходовать товары на склад</p>
          </div>
          <button onClick={confirm} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
            Провести документ
          </button>
        </div>
      )}

      {doc.status === "CONFIRMED" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Документ проведён. Товары оприходованы на склад.</p>
        </div>
      )}
    </div>
  );
}
