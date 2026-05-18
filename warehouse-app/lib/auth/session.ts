import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function getSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(allowed: Role[]) {
  const session = await getSession();
  const role = session.user.role as Role;
  if (!allowed.includes(role)) redirect("/dashboard");
  return session;
}
