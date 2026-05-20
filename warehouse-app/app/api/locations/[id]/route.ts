import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { locationSchema } from "@/lib/validators/reference";
import { requirePermission, badRequest, notFound } from "@/lib/api/helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = locationSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const old = await db.storageLocation.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  const data = {
    warehouseId: parsed.data.warehouseId,
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description || null,
  };

  try {
    const location = await db.storageLocation.update({ where: { id: params.id }, data });
    await logAudit({ userId: r.session.user.id!, action: "UPDATE", entityType: "StorageLocation", entityId: params.id, oldValue: { name: old.name, code: old.code }, newValue: data });
    return NextResponse.json(location);
  } catch {
    return badRequest("Бұл қоймада осындай кодпен орын бар", 409);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const refCount = await db.stockMovement.count({ where: { storageLocationId: params.id } });
  if (refCount > 0) return badRequest("Орынмен байланысты қозғалыстар бар. Тек әрекетсіз ете аласыз.", 409);

  const old = await db.storageLocation.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  await db.storageLocation.update({ where: { id: params.id }, data: { isActive: false } });
  await logAudit({ userId: r.session.user.id!, action: "DELETE", entityType: "StorageLocation", entityId: params.id, oldValue: { name: old.name, code: old.code } });
  return NextResponse.json({ ok: true });
}
