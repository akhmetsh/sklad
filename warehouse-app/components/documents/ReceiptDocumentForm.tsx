"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { receiptDocumentSchema, type ReceiptDocumentInput } from "@/lib/validators/document";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { ScanProductButton } from "@/components/documents/ScanProductButton";
import { formatMoney } from "@/lib/format";
import { todayISO } from "@/lib/format";
import { t } from "@/lib/i18n";

interface Props {
  suppliers: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string; sku: string; unit: { symbol: string } }[];
  locations: { id: string; name: string; code: string; warehouseId: string }[];
}

export function ReceiptDocumentForm({ suppliers, warehouses, products, locations }: Props) {
  const router = useRouter();
  const toast = useToast();

  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<ReceiptDocumentInput>({
    resolver: zodResolver(receiptDocumentSchema),
    defaultValues: {
      date: todayISO() as unknown as Date,
      items: [{ productId: "", storageLocationId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const warehouseId = useWatch({ control, name: "warehouseId" });
  const items = useWatch({ control, name: "items" });

  const filteredLocations = locations.filter((l) => l.warehouseId === warehouseId);

  const total = (items ?? []).reduce((sum, item) => {
    const qty = Number(item?.quantity) || 0;
    const price = Number(item?.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  async function onSubmit(data: ReceiptDocumentInput) {
    try {
      const res = await fetch("/api/documents/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(typeof body.error === "string" ? body.error : t.errors.generic);
        return;
      }
      const doc = await res.json();
      toast.success(t.documents.receipts.created);
      router.push(`/documents/receipts/${doc.id}`);
      router.refresh();
    } catch {
      toast.error(t.errors.network);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Document header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.documents.common.requisites}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t.documents.receipts.fields.supplier} required error={errors.supplierId?.message}>
            <Select {...register("supplierId")} error={!!errors.supplierId}>
              <option value="">{t.common.select}</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
          <FormField label={t.documents.common.warehouse} required error={errors.warehouseId?.message}>
            <Select {...register("warehouseId")} error={!!errors.warehouseId}>
              <option value="">{t.common.select}</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </FormField>
          <FormField label={t.documents.common.date} required error={errors.date?.message as string | undefined}>
            <Input type="date" {...register("date")} error={!!errors.date} />
          </FormField>
          <FormField label={t.documents.common.comment}>
            <Input {...register("comment")} />
          </FormField>
        </div>
      </div>

      {/* Item rows */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">{t.documents.common.items}</h2>
          <button
            type="button"
            onClick={() => append({ productId: "", storageLocationId: "", quantity: 1 })}
            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> {t.documents.common.addRow}
          </button>
        </div>

        {errors.items?.message && (
          <div className="px-4 sm:px-6 py-2 text-sm text-red-600 border-b border-red-100 bg-red-50">
            {errors.items.message}
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {fields.map((field, i) => {
            const itemErrors = errors.items?.[i];
            return (
              <div key={field.id} className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 sm:items-start">
                <div className="sm:col-span-4">
                  <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">{t.documents.common.product}</label>
                  <div className="flex gap-1">
                    <Select {...register(`items.${i}.productId`)} error={!!itemErrors?.productId}>
                      <option value="">{t.common.select}</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </Select>
                    <ScanProductButton onProductFound={(id) => setValue(`items.${i}.productId`, id, { shouldDirty: true, shouldValidate: true })} />
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">{t.documents.common.location}</label>
                  <Select {...register(`items.${i}.storageLocationId`)} error={!!itemErrors?.storageLocationId} disabled={!warehouseId}>
                    <option value="">{warehouseId ? t.common.select : t.documents.common.warehouse}</option>
                    {filteredLocations.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <div className="sm:col-span-2">
                    <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">{t.common.quantity}</label>
                    <Input
                      type="number" step="0.001" min="0.001"
                      {...register(`items.${i}.quantity`)}
                      error={!!itemErrors?.quantity}
                      className="text-right tabular-nums"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">{t.documents.receipts.fields.unitPrice}</label>
                    <Input
                      type="number" step="0.01" min="0"
                      {...register(`items.${i}.unitPrice`)}
                      placeholder="—"
                      className="text-right tabular-nums"
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <div className="sm:col-span-1 flex justify-end items-start">
                  {fields.length > 1 && (
                    <button
                      type="button" onClick={() => remove(i)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      aria-label={t.common.delete}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {total > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">{t.common.total}:</span>
            <span className="text-base font-semibold text-gray-900 font-mono tabular-nums">{formatMoney(total)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          {t.common.cancel}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {t.documents.common.createDraft}
        </Button>
      </div>
    </form>
  );
}
