import { z } from "zod";
import { t } from "@/lib/i18n";

const req = t.validation.required;
const positive = t.validation.positiveNumber;

export const receiptItemSchema = z.object({
  productId: z.string().min(1, req),
  storageLocationId: z.string().min(1, req),
  quantity: z.coerce.number().positive(positive),
  unitPrice: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  comment: z.string().optional(),
});

export const receiptDocumentSchema = z.object({
  supplierId: z.string().min(1, req),
  warehouseId: z.string().min(1, req),
  date: z.coerce.date(),
  comment: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, "Кемінде бір позиция қосыңыз"),
});

export const issueItemSchema = z.object({
  productId: z.string().min(1, req),
  storageLocationId: z.string().min(1, req),
  quantity: z.coerce.number().positive(positive),
  comment: z.string().optional(),
});

export const issueDocumentSchema = z.object({
  warehouseId: z.string().min(1, req),
  date: z.coerce.date(),
  recipientName: z.string().min(1, req),
  comment: z.string().optional(),
  items: z.array(issueItemSchema).min(1, "Кемінде бір позиция қосыңыз"),
});

export const transferItemSchema = z.object({
  productId: z.string().min(1, req),
  fromStorageLocationId: z.string().min(1, req),
  toStorageLocationId: z.string().min(1, req),
  quantity: z.coerce.number().positive(positive),
  comment: z.string().optional(),
});

export const transferDocumentSchema = z.object({
  fromWarehouseId: z.string().min(1, req),
  toWarehouseId: z.string().min(1, req),
  date: z.coerce.date(),
  comment: z.string().optional(),
  items: z.array(transferItemSchema).min(1, "Кемінде бір позиция қосыңыз"),
}).refine((d) => d.fromWarehouseId !== d.toWarehouseId, { message: "Қоймалар әртүрлі болуы керек", path: ["toWarehouseId"] });

export type ReceiptDocumentInput = z.infer<typeof receiptDocumentSchema>;
export type IssueDocumentInput = z.infer<typeof issueDocumentSchema>;
export type TransferDocumentInput = z.infer<typeof transferDocumentSchema>;
