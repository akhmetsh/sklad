import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserCreateForm } from "@/components/forms/UserCreateForm";

export default async function NewUserPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-4">
      <PageHeader title="Создать пользователя" backHref="/users" />
      <UserCreateForm />
    </div>
  );
}
