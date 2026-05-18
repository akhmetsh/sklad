import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { transferDocumentSchema } from "@/lib/validators/document";
import { createTransferDocument } from "@/lib/services/transfer.service";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role as Role, "createDocuments")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = transferDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const doc = await createTransferDocument(parsed.data, session.user.id!);
    return NextResponse.json(doc, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
