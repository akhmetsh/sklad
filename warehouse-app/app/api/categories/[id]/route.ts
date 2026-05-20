import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { categorySchema } from "@/lib/validators/reference";
import { requirePermission, badRequest, notFound } from "@/lib/api/helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = categorySchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const old = await db.category.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  const data = { name: parsed.data.name, description: parsed.data.description || null };
  const category = await db.category.update({ where: { id: params.id }, data });
  await logAudit({ userId: r.session.user.id!, action: "UPDATE", entityType: "Category", entityId: params.id, oldValue: { name: old.name, description: old.description }, newValue: data });
  return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const refCount = await db.product.count({ where: { categoryId: params.id, isActive: true } });
  if (refCount > 0) return badRequest("Санатта тауарлар бар. Алдымен оларды басқа санатқа ауыстырыңыз.", 409);

  const old = await db.category.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  await db.category.update({ where: { id: params.id }, data: { isActive: false } });
  await logAudit({ userId: r.session.user.id!, action: "DELETE", entityType: "Category", entityId: params.id, oldValue: { name: old.name } });
  return NextResponse.json({ ok: true });
}
