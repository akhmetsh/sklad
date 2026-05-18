"use client";

import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo/store";
import { computeStock } from "@/lib/demo/types";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Черновик", cls: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "Проведён", cls: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Отменён", cls: "bg-gray-100 text-gray-500" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500" };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-medium ${cls}`}>{label}</span>;
}

export default function DemoTransferDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { state, dispatch } = useDemo();
  const doc = state.transfers.find((r) => r.id === params.id);

  if (!doc) return <div className="p-8 text-gray-400">Документ не найден</div>;

  const fromWh = state.warehouses.find((w) => w.id === doc.fromWarehouseId);
  const toWh = state.warehouses.find((w) => w.id === doc.toWarehouseId);
  const stock = computeStock(state.movements);

  function getAvailable(productId: string, locationId: string) {
    return stock.find((b) => b.productId === productId && b.warehouseId === doc!.fromWarehouseId && b.storageLocationId === locationId)?.quantity ?? 0;
  }

  const canConfirm = doc.status === "DRAFT" && doc.items.every((item) => getAvailable(item.productId, item.fromStorageLocationId!) >= item.quantity);

  function confirm() {
    dispatch({ type: "CONFIRM_TRANSFER", id: doc!.id });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button onClick={() => router.back()} className="text-xs text-blue-600 hover:underline mb-1 block">← Назад к перемещениям</button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold font-mono">{doc.documentNumber}</h1>
          <StatusBadge status={doc.status} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Реквизиты</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><dt className="text-gray-500">Откуда</dt><dd className="font-medium">{fromWh?.name ?? "—"}</dd></div>
          <div><dt className="text-gray-500">Куда</dt><dd className="font-medium">{toWh?.name ?? "—"}</dd></div>
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
            <th className="px-4 py-2 text-left font-medium text-gray-500">Откуда (место)</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Куда (место)</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Кол-во</th>
            {doc.status === "DRAFT" && <th className="px-4 py-2 text-right font-medium text-gray-500">Доступно</th>}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {doc.items.map((item) => {
              const product = state.products.find((p) => p.id === item.productId);
              const unit = state.units.find((u) => u.id === product?.unitId);
              const fromLoc = state.locations.find((l) => l.id === item.fromStorageLocationId);
              const toLoc = state.locations.find((l) => l.id === item.toStorageLocationId);
              const available = getAvailable(item.productId, item.fromStorageLocationId!);
              const insufficient = available < item.quantity;
              return (
                <tr key={item.id} className={doc.status === "DRAFT" && insufficient ? "bg-red-50" : ""}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{product?.name ?? item.productId}</div>
                    <div className="text-xs text-gray-400">{product?.sku}</div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{fromLoc?.name ?? item.fromStorageLocationId}</td>
                  <td className="px-4 py-2.5 text-gray-600">{toLoc?.name ?? item.toStorageLocationId}</td>
                  <td className="px-4 py-2.5 text-right">{item.quantity} {unit?.symbol}</td>
                  {doc.status === "DRAFT" && (
                    <td className={`px-4 py-2.5 text-right font-medium ${insufficient ? "text-red-600" : "text-green-700"}`}>
                      {available} {unit?.symbol}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {doc.status === "DRAFT" && (
        <div className={`border rounded-lg p-4 flex items-center justify-between ${canConfirm ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
          <div>
            <p className={`text-sm font-medium ${canConfirm ? "text-yellow-800" : "text-red-700"}`}>
              {canConfirm ? "Черновик готов к проведению" : "Недостаточно остатков для перемещения"}
            </p>
            <p className={`text-xs mt-0.5 ${canConfirm ? "text-yellow-600" : "text-red-500"}`}>
              {canConfirm ? "Нажмите «Провести», чтобы переместить товары" : "Пополните запасы на складе-отправителе"}
            </p>
          </div>
          {canConfirm && (
            <button onClick={confirm} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
              Провести документ
            </button>
          )}
        </div>
      )}

      {doc.status === "CONFIRMED" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            Документ проведён. Товары перемещены из «{fromWh?.name}» в «{toWh?.name}».
          </p>
        </div>
      )}
    </div>
  );
}
