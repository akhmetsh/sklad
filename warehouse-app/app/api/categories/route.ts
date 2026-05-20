import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { categorySchema } from "@/lib/validators/reference";
import { requireSession, requirePermission, badRequest } from "@/lib/api/helpers";

export async function GET() {
  const r = await requireSession();
  if ("response" in r) return r.response;

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const parsed = categorySchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const data = { name: parsed.data.name, description: parsed.data.description || null };
  const category = await db.category.create({ data });
  await logAudit({ userId: r.session.user.id!, action: "CREATE", entityType: "Category", entityId: category.id, newValue: data });
  return NextResponse.json(category, { status: 201 });
}
