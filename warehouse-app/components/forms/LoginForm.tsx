"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { t } from "@/lib/i18n";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t.auth.login.invalidCredentials);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label={t.auth.login.email} required>
        <Input name="email" type="email" required autoComplete="email" autoFocus />
      </FormField>
      <FormField label={t.auth.login.password} required>
        <Input name="password" type="password" required autoComplete="current-password" />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={loading} fullWidth size="lg">
        {t.auth.login.submit}
      </Button>
    </form>
  );
}
