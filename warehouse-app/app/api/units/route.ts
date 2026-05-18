import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1, "Название обязательно"),
  symbol: z.string().min(1, "Обозначение обязательно"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const units = await db.unit.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role as Role, "manageReferenceData")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const unit = await db.unit.create({ data: parsed.data });
  await logAudit({ userId: session.user.id!, action: "CREATE", entityType: "Unit", entityId: unit.id, newValue: parsed.data });
  return NextResponse.json(unit, { status: 201 });
}
