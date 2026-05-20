"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, ArrowRight } from "lucide-react";
import { transferDocumentSchema, type TransferDocumentInput } from "@/lib/validators/document";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { ScanProductButton } from "@/components/documents/ScanProductButton";
import { todayISO } from "@/lib/format";
import { t } from "@/lib/i18n";

interface StockEntry { productId: string; warehouseId: string; storageLocationId: string; quantity: number; }

interface Props {
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string; sku: string; unit: { symbol: string } }[];
  locations: { id: string; name: string; code: string; warehouseId: string }[];
  stock: StockEntry[];
}

export function TransferDocumentForm({ warehouses, products, locations, stock }: Props) {
  const router = useRouter();
  const toast = useToast();

  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<TransferDocumentInput>({
    resolver: zodResolver(transferDocumentSchema),
    defaultValues: {
      date: todayISO() as unknown as Date,
      items: [{ productId: "", fromStorageLocationId: "", toStorageLocationId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const fromWarehouseId = useWatch({ control, name: "fromWarehouseId" });
  const toWarehouseId = useWatch({ control, name: "toWarehouseId" });
  const items = useWatch({ control, name: "items" });

  const fromLocations = locations.filter((l) => l.warehouseId === fromWarehouseId);
  const toLocations = locations.filter((l) => l.warehouseId === toWarehouseId);

  function availableFor(productId: string, locationId: string): number | null {
    if (!fromWarehouseId || !productId || !locationId) return null;
    const entry = stock.find(
      (s) => s.productId === productId && s.warehouseId === fromWarehouseId && s.storageLocationId === locationId,
    );
    return entry?.quantity ?? 0;
  }

  async function onSubmit(data: TransferDocumentInput) {
    try {
      const res = await fetch("/api/documents/transfers", {
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
      toast.success(t.documents.transfers.created);
      router.push(`/documents/transfers/${doc.id}`);
      router.refresh();
    } catch {
      toast.error(t.errors.network);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t.documents.common.requisites}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t.documents.transfers.fields.fromWarehouse} required error={errors.fromWarehouseId?.message}>
            <Select {...register("fromWarehouseId")} error={!!errors.fromWarehouseId}>
              <option value="">{t.common.select}</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </FormField>
          <FormField label={t.documents.transfers.fields.toWarehouse} required error={errors.toWarehouseId?.message}>
            <Select {...register("toWarehouseId")} error={!!errors.toWarehouseId}>
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

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">{t.documents.common.items}</h2>
          <button
            type="button"
            onClick={() => append({ productId: "", fromStorageLocationId: "", toStorageLocationId: "", quantity: 1 })}
            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> {t.documents.common.addRow}
          </button>
        </div>

        {errors.items?.message && (
          <div className="px-4 sm:px-6 py-2 text-sm text-red-600 border-b border-red-100 bg-red-50">{errors.items.message}</div>
        )}

        {/* Column headers — visible only on desktop */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 sm:px-6 py-2 border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
          <div className="sm:col-span-4">{t.documents.common.product}</div>
          <div className="sm:col-span-3">{t.documents.transfers.fields.fromLocation}</div>
          <div className="sm:col-span-1" />
          <div className="sm:col-span-3">{t.documents.transfers.fields.toLocation}</div>
          <div className="sm:col-span-1 text-right">{t.common.quantity}</div>
        </div>

        <div className="divide-y divide-gray-100">
          {fields.map((field, i) => {
            const itemErrors = errors.items?.[i];
            const row = items?.[i];
            const available = availableFor(row?.productId ?? "", row?.fromStorageLocationId ?? "");
            const required = Number(row?.quantity) || 0;
            const insufficient = available !== null && required > available;
            return (
              <div key={field.id} className="p-3 sm:p-4 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 sm:items-start">
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
                    <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">{t.documents.transfers.fields.fromLocation}</label>
                    <Select {...register(`items.${i}.fromStorageLocationId`)} error={!!itemErrors?.fromStorageLocationId} disabled={!fromWarehouseId}>
                      <option value="">{fromWarehouseId ? t.common.select : t.documents.transfers.fields.fromWarehouse}</option>
                      {fromLocations.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
                    </Select>
                  </div>
                  <div className="hidden sm:flex sm:col-span-1 sm:justify-center sm:items-center sm:pt-2 text-gray-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">{t.documents.transfers.fields.toLocation}</label>
                    <Select {...register(`items.${i}.toStorageLocationId`)} error={!!itemErrors?.toStorageLocationId} disabled={!toWarehouseId}>
                      <option value="">{toWarehouseId ? t.common.select : t.documents.transfers.fields.toWarehouse}</option>
                      {toLocations.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
                    </Select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="sm:hidden text-xs font-medium text-gray-500 mb-1 block">{t.common.quantity}</label>
                    <Input
                      type="number" step="0.001" min="0.001"
                      {...register(`items.${i}.quantity`)}
                      error={!!itemErrors?.quantity || insufficient}
                      className="text-right tabular-nums"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="sm:col-span-12 sm:hidden flex justify-end">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(i)} className="p-2 text-gray-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="hidden sm:flex sm:absolute sm:right-0">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(i)} className="p-2 text-gray-400 hover:text-red-600 -mt-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {available !== null && (
                  <p className={`text-xs ${insufficient ? "text-red-600 font-medium" : "text-gray-500"}`}>
                    {insufficient ? `⚠ ${t.documents.common.insufficient} — ${t.documents.common.available}: ${available}` : `${t.documents.common.available}: ${available}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
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
