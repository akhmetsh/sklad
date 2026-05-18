"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { receiptDocumentSchema, type ReceiptDocumentInput } from "@/lib/validators/document";

interface Props {
  suppliers: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string; unit: { symbol: string } }[];
  locations: { id: string; name: string; code: string; warehouseId: string }[];
}

export function ReceiptDocumentForm({ suppliers, warehouses, products, locations }: Props) {
  const router = useRouter();
  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm<ReceiptDocumentInput>({
    resolver: zodResolver(receiptDocumentSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0] as unknown as Date,
      items: [{ productId: "", storageLocationId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const selectedWarehouseId = watch("warehouseId");
  const filteredLocations = locations.filter((l) => l.warehouseId === selectedWarehouseId);

  async function onSubmit(data: ReceiptDocumentInput) {
    const res = await fetch("/api/documents/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Ошибка создания документа");
      return;
    }

    const doc = await res.json();
    router.push(`/documents/receipts/${doc.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-2 gap-4">
        <Field label="Поставщик *" error={(errors as { supplierId?: { message?: string } }).supplierId?.message}>
          <select {...register("supplierId")} className={inp}>
            <option value="">— выберите —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Склад *" error={(errors as { warehouseId?: { message?: string } }).warehouseId?.message}>
          <select {...register("warehouseId")} className={inp}>
            <option value="">— выберите —</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </Field>
        <Field label="Дата *">
          <input type="date" {...register("date")} className={inp} />
        </Field>
        <Field label="Комментарий" className="col-span-2">
          <input {...register("comment")} className={inp} />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="font-medium text-sm">Позиции документа</span>
          <button
            type="button"
            onClick={() => append({ productId: "", storageLocationId: "", quantity: 1 })}
            className="text-blue-600 text-sm hover:underline"
          >
            + Добавить строку
          </button>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Товар</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Место хранения</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Кол-во</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Цена</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fields.map((field, i) => (
              <tr key={field.id}>
                <td className="px-3 py-2">
                  <select {...register(`items.${i}.productId`)} className={inp}>
                    <option value="">— товар —</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select {...register(`items.${i}.storageLocationId`)} className={inp} disabled={!selectedWarehouseId}>
                    <option value="">— место —</option>
                    {filteredLocations.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input type="number" step="0.001" min="0.001" {...register(`items.${i}.quantity`)} className={`${inp} text-right w-24`} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" step="0.01" min="0" {...register(`items.${i}.unitPrice`)} className={`${inp} text-right w-24`} placeholder="—" />
                </td>
                <td className="px-3 py-2 text-center">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60">
          {isSubmitting ? "Сохранение..." : "Сохранить черновик"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
          Отмена
        </button>
      </div>
    </form>
  );
}

const inp = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
