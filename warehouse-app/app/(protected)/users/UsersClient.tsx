"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, RoleBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";

interface User {
  id: string; name: string; email: string;
  role: string; isActive: boolean; createdAt: string;
}

export function UsersClient({ users }: { users: User[] }) {
  const columns: Column<User>[] = [
    { key: "name", header: t.users.fields.name, mobilePrimary: true, cell: (u) => <span className="font-medium">{u.name}</span> },
    { key: "email", header: t.users.fields.email, cell: (u) => <span className="text-gray-600">{u.email}</span> },
    { key: "role", header: t.users.fields.role, cell: (u) => <RoleBadge role={u.role} /> },
    {
      key: "status", header: t.common.status,
      cell: (u) => <Badge tone={u.isActive ? "green" : "gray"}>{u.isActive ? t.status.active : t.status.inactive}</Badge>,
    },
    {
      key: "createdAt", header: t.users.addedAt, hideOnMobile: true,
      cell: (u) => <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(u.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t.users.title} description={t.users.subtitle}>
        <Link href="/users/new">
          <Button><Plus className="w-4 h-4" /> {t.users.create}</Button>
        </Link>
      </PageHeader>

      <DataTable columns={columns} data={users} rowKey={(u) => u.id} />
    </div>
  );
}
