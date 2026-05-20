import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { supplierSchema } from "@/lib/validators/reference";
import { requireSession, requirePermission, badRequest } from "@/lib/api/helpers";

export async function GET() {
  const r = await requireSession();
  if ("response" in r) return r.response;

  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { receipts: true } } },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = supplierSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const data = {
    name: parsed.data.name,
    contactPerson: parsed.data.contactPerson || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    description: parsed.data.description || null,
  };
  const supplier = await db.supplier.create({ data });
  await logAudit({ userId: r.session.user.id!, action: "CREATE", entityType: "Supplier", entityId: supplier.id, newValue: data });
  return NextResponse.json(supplier, { status: 201 });
}
