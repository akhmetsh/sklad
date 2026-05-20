import { z } from "zod";
import { t } from "@/lib/i18n";

export const userCreateSchema = z.object({
  name: z.string().min(1, t.validation.required),
  email: z.string().email(t.validation.email),
  password: z.string().min(6, t.validation.minLength(6)),
  role: z.enum(["ADMIN", "STOREKEEPER", "MANAGER"]),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
