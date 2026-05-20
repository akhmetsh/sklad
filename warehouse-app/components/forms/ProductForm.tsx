"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductInput } from "@/lib/validators/product";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";

interface Props {
  categories: { id: string; name: string }[];
  units: { id: string; name: string; symbol: string }[];
  product?: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    imageUrl: string | null;
    categoryId: string;
    unitId: string;
    description: string | null;
    minStock: { toString(): string };
  };
}

export function ProductForm({ categories, units, product }: Props) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!product;

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          barcode: product.barcode ?? "",
          imageUrl: product.imageUrl ?? "",
          categoryId: product.categoryId,
          unitId: product.unitId,
          description: product.description ?? "",
          minStock: parseFloat(product.minStock.toString()),
        }
      : { minStock: 0, barcode: "", imageUrl: "", description: "" },
  });

  async function onSubmit(data: ProductInput) {
    const url = isEdit ? `/api/products/${product!.id}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(typeof body.error === "string" ? body.error : t.errors.generic);
        return;
      }
      toast.success(isEdit ? t.products.updated : t.products.created);
      router.push("/products");
      router.refresh();
    } catch {
      toast.error(t.errors.network);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4">
      <FormField label={t.products.image}>
        <Controller
          control={control}
          name="imageUrl"
          render={({ field }) => (
            <ImagePicker value={field.value ?? ""} onChange={field.onChange} />
          )}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
        <FormField label={t.products.fields.name} required error={errors.name?.message}>
          <Input {...register("name")} error={!!errors.name} autoFocus />
        </FormField>
        <FormField label={t.products.fields.sku} required error={errors.sku?.message}>
          <Input {...register("sku")} error={!!errors.sku} className="font-mono" />
        </FormField>
        <FormField label={t.products.fields.category} required error={errors.categoryId?.message}>
          <Select {...register("categoryId")} error={!!errors.categoryId}>
            <option value="">{t.common.select}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField label={t.products.fields.unit} required error={errors.unitId?.message}>
          <Select {...register("unitId")} error={!!errors.unitId}>
            <option value="">{t.common.select}</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
          </Select>
        </FormField>
        <FormField label={t.products.fields.minStock} error={errors.minStock?.message}>
          <Input type="number" step="0.001" min="0" {...register("minStock")} error={!!errors.minStock} inputMode="decimal" />
        </FormField>
        <FormField label={t.products.fields.barcode} error={errors.barcode?.message}>
          <Input {...register("barcode")} error={!!errors.barcode} inputMode="numeric" />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label={t.products.fields.description} error={errors.description?.message}>
            <Textarea {...register("description")} rows={3} error={!!errors.description} />
          </FormField>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          {t.common.cancel}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? t.common.save : t.common.create}
        </Button>
      </div>
    </form>
  );
}
