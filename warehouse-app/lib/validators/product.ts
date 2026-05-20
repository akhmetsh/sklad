import { z } from "zod";
import { t } from "@/lib/i18n";

const req = t.validation.required;

export const productSchema = z.object({
  name: z.string().min(1, req),
  sku: z.string().min(1, req),
  barcode: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1, req),
  unitId: z.string().min(1, req),
  description: z.string().optional().or(z.literal("")),
  minStock: z.coerce.number().min(0, t.validation.positiveNumber),
});

export type ProductInput = z.infer<typeof productSchema>;
