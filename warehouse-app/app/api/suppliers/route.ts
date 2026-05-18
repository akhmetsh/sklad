import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1, "Название обязательно"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role as Role, "manageReferenceData")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const supplier = await db.supplier.create({ data: parsed.data });
  await logAudit({ userId: session.user.id!, action: "CREATE", entityType: "Supplier", entityId: supplier.id, newValue: parsed.data });
  return NextResponse.json(supplier, { status: 201 });
}
