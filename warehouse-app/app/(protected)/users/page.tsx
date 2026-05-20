import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);
  const users = await db.user.findMany({ orderBy: { name: "asc" } });

  return (
    <UsersClient
      users={users.map((u) => ({
        id: u.id,
        name: u.name ?? "",
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  );
}
