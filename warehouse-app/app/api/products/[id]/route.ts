import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validators/product";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const old = await db.product.findUnique({ where: { id: params.id } });
  if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const product = await db.product.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await logAudit({
    userId: session.user.id!,
    action: "UPDATE",
    entityType: "Product",
    entityId: product.id,
    oldValue: { name: old.name, sku: old.sku },
    newValue: parsed.data,
  });

  return NextResponse.json(product);
}
