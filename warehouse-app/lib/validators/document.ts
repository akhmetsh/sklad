import { z } from "zod";

export const receiptItemSchema = z.object({
  productId: z.string().min(1),
  storageLocationId: z.string().min(1),
  quantity: z.coerce.number().positive("Количество должно быть положительным"),
  unitPrice: z.coerce.number().min(0).optional(),
  comment: z.string().optional(),
});

export const receiptDocumentSchema = z.object({
  supplierId: z.string().min(1, "Поставщик обязателен"),
  warehouseId: z.string().min(1, "Склад обязателен"),
  date: z.coerce.date(),
  comment: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, "Добавьте хотя бы одну строку"),
});

export const issueItemSchema = z.object({
  productId: z.string().min(1),
  storageLocationId: z.string().min(1),
  quantity: z.coerce.number().positive("Количество должно быть положительным"),
  comment: z.string().optional(),
});

export const issueDocumentSchema = z.object({
  warehouseId: z.string().min(1, "Склад обязателен"),
  date: z.coerce.date(),
  recipientName: z.string().min(1, "Получатель обязателен"),
  comment: z.string().optional(),
  items: z.array(issueItemSchema).min(1, "Добавьте хотя бы одну строку"),
});

export const transferItemSchema = z.object({
  productId: z.string().min(1),
  fromStorageLocationId: z.string().min(1),
  toStorageLocationId: z.string().min(1),
  quantity: z.coerce.number().positive("Количество должно быть положительным"),
  comment: z.string().optional(),
});

export const transferDocumentSchema = z.object({
  fromWarehouseId: z.string().min(1, "Склад отправления обязателен"),
  toWarehouseId: z.string().min(1, "Склад назначения обязателен"),
  date: z.coerce.date(),
  comment: z.string().optional(),
  items: z.array(transferItemSchema).min(1, "Добавьте хотя бы одну строку"),
});

export type ReceiptDocumentInput = z.infer<typeof receiptDocumentSchema>;
export type IssueDocumentInput = z.infer<typeof issueDocumentSchema>;
export type TransferDocumentInput = z.infer<typeof transferDocumentSchema>;
