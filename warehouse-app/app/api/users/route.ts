import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { logAudit } from "@/lib/audit";
import { userCreateSchema } from "@/lib/validators/user";
import { requirePermission, badRequest } from "@/lib/api/helpers";

export async function POST(req: NextRequest) {
  const r = await requirePermission("manageUsers");
  if ("response" in r) return r.response;

  const parsed = userCreateSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return badRequest("Бұл email-мен пайдаланушы тіркелген", 409);

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash, role: parsed.data.role },
  });

  await logAudit({
    userId: r.session.user.id!,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    newValue: { name: user.name, email: user.email, role: user.role },
  });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
}
