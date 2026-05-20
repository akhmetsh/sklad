"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userCreateSchema, type UserCreateInput } from "@/lib/validators/user";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";

export function UserCreateForm() {
  const router = useRouter();
  const toast = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { role: "STOREKEEPER" },
  });

  async function onSubmit(data: UserCreateInput) {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(typeof body.error === "string" ? body.error : t.errors.generic);
        return;
      }
      toast.success(t.users.created);
      router.push("/users");
      router.refresh();
    } catch {
      toast.error(t.errors.network);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4 max-w-lg">
      <FormField label={t.users.fields.name} required error={errors.name?.message}>
        <Input {...register("name")} error={!!errors.name} autoFocus />
      </FormField>
      <FormField label={t.users.fields.email} required error={errors.email?.message}>
        <Input type="email" {...register("email")} error={!!errors.email} autoComplete="off" />
      </FormField>
      <FormField label={t.users.fields.password} required hint={t.validation.minLength(6)} error={errors.password?.message}>
        <Input type="password" {...register("password")} error={!!errors.password} autoComplete="new-password" />
      </FormField>
      <FormField label={t.users.fields.role} required error={errors.role?.message}>
        <Select {...register("role")} error={!!errors.role}>
          <option value="STOREKEEPER">{t.roles.STOREKEEPER}</option>
          <option value="MANAGER">{t.roles.MANAGER}</option>
          <option value="ADMIN">{t.roles.ADMIN}</option>
        </Select>
      </FormField>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        {t.users.passwordNote}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          {t.common.cancel}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {t.common.create}
        </Button>
      </div>
    </form>
  );
}
