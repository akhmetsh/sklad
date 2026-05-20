import { z } from "zod";
import { t } from "@/lib/i18n";

const req = t.validation.required;
const email = t.validation.email;

export const categorySchema = z.object({
  name: z.string().min(1, req),
  description: z.string().optional().or(z.literal("")),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const unitSchema = z.object({
  name: z.string().min(1, req),
  symbol: z.string().min(1, req),
});
export type UnitInput = z.infer<typeof unitSchema>;

export const warehouseSchema = z.object({
  name: z.string().min(1, req),
  address: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});
export type WarehouseInput = z.infer<typeof warehouseSchema>;

export const locationSchema = z.object({
  warehouseId: z.string().min(1, req),
  code: z.string().min(1, req),
  name: z.string().min(1, req),
  description: z.string().optional().or(z.literal("")),
});
export type LocationInput = z.infer<typeof locationSchema>;

export const supplierSchema = z.object({
  name: z.string().min(1, req),
  contactPerson: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email(email).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});
export type SupplierInput = z.infer<typeof supplierSchema>;
