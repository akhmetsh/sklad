import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { warehouseSchema } from "@/lib/validators/reference";
import { requireSession, requirePermission, badRequest } from "@/lib/api/helpers";

export async function GET() {
  const r = await requireSession();
  if ("response" in r) return r.response;

  const warehouses = await db.warehouse.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { locations: { where: { isActive: true } } } } },
  });
  return NextResponse.json(warehouses);
}

export async function POST(req: NextRequest) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = warehouseSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const data = {
    name: parsed.data.name,
    address: parsed.data.address || null,
    description: parsed.data.description || null,
  };
  const warehouse = await db.warehouse.create({ data });
  await logAudit({ userId: r.session.user.id!, action: "CREATE", entityType: "Warehouse", entityId: warehouse.id, newValue: data });
  return NextResponse.json(warehouse, { status: 201 });
}
