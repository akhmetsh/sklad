import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validators/product";
import { logAudit } from "@/lib/audit";
import { requirePermission, badRequest, notFound } from "@/lib/api/helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const old = await db.product.findUnique({ where: { id: params.id } });
  if (!old) return notFound();

  const data = {
    name: parsed.data.name,
    sku: parsed.data.sku,
    barcode: parsed.data.barcode || null,
    categoryId: parsed.data.categoryId,
    unitId: parsed.data.unitId,
    description: parsed.data.description || null,
    minStock: parsed.data.minStock,
  };

  try {
    const product = await db.product.update({ where: { id: params.id }, data });
    await logAudit({ userId: r.session.user.id!, action: "UPDATE", entityType: "Product", entityId: product.id, oldValue: { name: old.name, sku: old.sku }, newValue: data });
    return NextResponse.json(product);
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("Unique") ? "Бұл артикул бар тауарда қолданылып жатыр" : "Тауарды сақтау мүмкін емес";
    return badRequest(msg, 409);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const movementCount = await db.stockMovement.count({ where: { productId: params.id } });
  if (movementCount > 0) {
    // Soft delete only — movements stay for history
    const old = await db.product.findUnique({ where: { id: params.id } });
    if (!old) return notFound();
    await db.product.update({ where: { id: params.id }, data: { isActive: false } });
    await logAudit({ userId: r.session.user.id!, action: "DELETE", entityType: "Product", entityId: params.id, oldValue: { name: old.name } });
    return NextResponse.json({ ok: true });
  }

  // No history — hard delete is allowed but we still soft-delete for consistency
  const old = await db.product.findUnique({ where: { id: params.id } });
  if (!old) return notFound();
  await db.product.update({ where: { id: params.id }, data: { isActive: false } });
  await logAudit({ userId: r.session.user.id!, action: "DELETE", entityType: "Product", entityId: params.id, oldValue: { name: old.name } });
  return NextResponse.json({ ok: true });
}
