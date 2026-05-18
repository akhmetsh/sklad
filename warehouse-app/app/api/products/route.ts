import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validators/product";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await db.product.findMany({
    include: { category: true, unit: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role as Role, "manageReferenceData")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const product = await db.product.create({ data: parsed.data });

  await logAudit({
    userId: session.user.id!,
    action: "CREATE",
    entityType: "Product",
    entityId: product.id,
    newValue: parsed.data,
  });

  return NextResponse.json(product, { status: 201 });
}
