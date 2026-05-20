import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { t } from "@/lib/i18n";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

type Permission = Parameters<typeof can>[1];

/** Returns the session, or a NextResponse to short-circuit the handler. */
export async function requireSession(): Promise<{ session: Session } | { response: NextResponse }> {
  const session = await auth();
  if (!session?.user) return { response: NextResponse.json({ error: t.errors.forbidden }, { status: 401 }) };
  return { session };
}

export async function requirePermission(permission: Permission): Promise<{ session: Session } | { response: NextResponse }> {
  const result = await requireSession();
  if ("response" in result) return result;
  if (!can(result.session.user.role as Role, permission)) {
    return { response: NextResponse.json({ error: t.errors.forbidden }, { status: 403 }) };
  }
  return result;
}

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function notFound() {
  return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
}
