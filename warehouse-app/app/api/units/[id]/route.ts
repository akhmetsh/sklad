import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { unitSchema } from "@/lib/validators/reference";
import { requirePermission, badRequest, notFound } from "@/lib/api/helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = unitSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const old = await db.unit.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  const unit = await db.unit.update({ where: { id: params.id }, data: parsed.data });
  await logAudit({ userId: r.session.user.id!, action: "UPDATE", entityType: "Unit", entityId: params.id, oldValue: { name: old.name, symbol: old.symbol }, newValue: parsed.data });
  return NextResponse.json(unit);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const refCount = await db.product.count({ where: { unitId: params.id, isActive: true } });
  if (refCount > 0) return badRequest("Бұл өлшем бірлігі тауарларда қолданылып жатыр.", 409);

  const old = await db.unit.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  await db.unit.update({ where: { id: params.id }, data: { isActive: false } });
  await logAudit({ userId: r.session.user.id!, action: "DELETE", entityType: "Unit", entityId: params.id, oldValue: { name: old.name } });
  return NextResponse.json({ ok: true });
}
