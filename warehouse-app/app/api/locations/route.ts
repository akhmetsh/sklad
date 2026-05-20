import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { locationSchema } from "@/lib/validators/reference";
import { requireSession, requirePermission, badRequest } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  const r = await requireSession();
  if ("response" in r) return r.response;

  const warehouseId = req.nextUrl.searchParams.get("warehouseId");
  const locations = await db.storageLocation.findMany({
    where: { isActive: true, ...(warehouseId ? { warehouseId } : {}) },
    orderBy: [{ warehouse: { name: "asc" } }, { code: "asc" }],
    include: { warehouse: { select: { id: true, name: true } } },
  });
  return NextResponse.json(locations);
}

export async function POST(req: NextRequest) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = locationSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const data = {
    warehouseId: parsed.data.warehouseId,
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description || null,
  };

  try {
    const location = await db.storageLocation.create({ data });
    await logAudit({ userId: r.session.user.id!, action: "CREATE", entityType: "StorageLocation", entityId: location.id, newValue: data });
    return NextResponse.json(location, { status: 201 });
  } catch {
    return badRequest("Бұл қоймада осындай кодпен орын бар", 409);
  }
}
