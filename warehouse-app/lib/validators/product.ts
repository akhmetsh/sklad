import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  sku: z.string().min(1, "Артикул обязателен"),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, "Категория обязательна"),
  unitId: z.string().min(1, "Единица измерения обязательна"),
  description: z.string().optional(),
  minStock: z.coerce.number().min(0),
});

export type ProductInput = z.infer<typeof productSchema>;
