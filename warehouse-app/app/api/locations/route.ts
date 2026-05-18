import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const schema = z.object({
  warehouseId: z.string().min(1, "Склад обязателен"),
  code: z.string().min(1, "Код обязателен"),
  name: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role as Role, "manageReferenceData")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const location = await db.storageLocation.create({ data: parsed.data });
    await logAudit({ userId: session.user.id!, action: "CREATE", entityType: "StorageLocation", entityId: location.id, newValue: parsed.data });
    return NextResponse.json(location, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Код места хранения уже существует на этом складе" }, { status: 409 });
  }
}
