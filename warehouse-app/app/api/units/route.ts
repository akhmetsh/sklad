import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { unitSchema } from "@/lib/validators/reference";
import { requireSession, requirePermission, badRequest } from "@/lib/api/helpers";

export async function GET() {
  const r = await requireSession();
  if ("response" in r) return r.response;

  const units = await db.unit.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = unitSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const unit = await db.unit.create({ data: parsed.data });
  await logAudit({ userId: r.session.user.id!, action: "CREATE", entityType: "Unit", entityId: unit.id, newValue: parsed.data });
  return NextResponse.json(unit, { status: 201 });
}
