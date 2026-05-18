"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductInput } from "@/lib/validators/product";

interface Props {
  categories: { id: string; name: string }[];
  units: { id: string; name: string; symbol: string }[];
  product?: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    categoryId: string;
    unitId: string;
    description: string | null;
    minStock: { toString(): string };
  };
}

export function ProductForm({ categories, units, product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          barcode: product.barcode ?? "",
          categoryId: product.categoryId,
          unitId: product.unitId,
          description: product.description ?? "",
          minStock: parseFloat(product.minStock.toString()),
        }
      : { minStock: 0 },
  });

  async function onSubmit(data: ProductInput) {
    const url = isEdit ? `/api/products/${product.id}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Ошибка сохранения");
      return;
    }

    router.push("/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Название *" error={errors.name?.message}>
          <input {...register("name")} className={input} />
        </Field>
        <Field label="Артикул (SKU) *" error={errors.sku?.message}>
          <input {...register("sku")} className={input} />
        </Field>
        <Field label="Штрихкод" error={errors.barcode?.message}>
          <input {...register("barcode")} className={input} />
        </Field>
        <Field label="Мин. остаток" error={errors.minStock?.message}>
          <input type="number" step="0.001" {...register("minStock")} className={input} />
        </Field>
        <Field label="Категория *" error={errors.categoryId?.message}>
          <select {...register("categoryId")} className={input}>
            <option value="">— выберите —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Единица измерения *" error={errors.unitId?.message}>
          <select {...register("unitId")} className={input}>
            <option value="">— выберите —</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
          </select>
        </Field>
        <Field label="Описание" error={errors.description?.message} className="col-span-2">
          <textarea {...register("description")} rows={3} className={input} />
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

const input = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
