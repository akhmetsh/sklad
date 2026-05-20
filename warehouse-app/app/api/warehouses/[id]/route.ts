import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { warehouseSchema } from "@/lib/validators/reference";
import { requirePermission, badRequest, notFound } from "@/lib/api/helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = warehouseSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const old = await db.warehouse.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  const data = {
    name: parsed.data.name,
    address: parsed.data.address || null,
    description: parsed.data.description || null,
  };
  const warehouse = await db.warehouse.update({ where: { id: params.id }, data });
  await logAudit({ userId: r.session.user.id!, action: "UPDATE", entityType: "Warehouse", entityId: params.id, oldValue: { name: old.name, address: old.address }, newValue: data });
  return NextResponse.json(warehouse);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const refCount = await db.storageLocation.count({ where: { warehouseId: params.id, isActive: true } });
  if (refCount > 0) return badRequest("Қоймада сақтау орындары бар. Алдымен оларды жойыңыз.", 409);

  const old = await db.warehouse.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  await db.warehouse.update({ where: { id: params.id }, data: { isActive: false } });
  await logAudit({ userId: r.session.user.id!, action: "DELETE", entityType: "Warehouse", entityId: params.id, oldValue: { name: old.name } });
  return NextResponse.json({ ok: true });
}
