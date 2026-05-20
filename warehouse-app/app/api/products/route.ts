import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validators/product";
import { logAudit } from "@/lib/audit";
import { requireSession, requirePermission, badRequest } from "@/lib/api/helpers";

export async function GET() {
  const r = await requireSession();
  if ("response" in r) return r.response;

  const products = await db.product.findMany({
    where: { isActive: true },
    include: { category: true, unit: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

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
    const product = await db.product.create({ data });
    await logAudit({ userId: r.session.user.id!, action: "CREATE", entityType: "Product", entityId: product.id, newValue: data });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("Unique") ? "Бұл артикул бар тауарда қолданылып жатыр" : "Тауарды жасау мүмкін емес";
    return badRequest(msg, 409);
  }
}
