import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserCreateForm } from "@/components/forms/UserCreateForm";
import { t } from "@/lib/i18n";

export default async function NewUserPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title={t.users.newTitle} backHref="/users" />
      <UserCreateForm />
    </div>
  );
}
