import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { supplierSchema } from "@/lib/validators/reference";
import { requirePermission, badRequest, notFound } from "@/lib/api/helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = supplierSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const old = await db.supplier.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  const data = {
    name: parsed.data.name,
    contactPerson: parsed.data.contactPerson || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    description: parsed.data.description || null,
  };
  const supplier = await db.supplier.update({ where: { id: params.id }, data });
  await logAudit({ userId: r.session.user.id!, action: "UPDATE", entityType: "Supplier", entityId: params.id, oldValue: { name: old.name }, newValue: data });
  return NextResponse.json(supplier);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const refCount = await db.receiptDocument.count({ where: { supplierId: params.id } });
  if (refCount > 0) return badRequest("Жеткізушімен байланысты құжаттар бар. Тек әрекетсіз ете аласыз.", 409);

  const old = await db.supplier.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  await db.supplier.update({ where: { id: params.id }, data: { isActive: false } });
  await logAudit({ userId: r.session.user.id!, action: "DELETE", entityType: "Supplier", entityId: params.id, oldValue: { name: old.name } });
  return NextResponse.json({ ok: true });
}
