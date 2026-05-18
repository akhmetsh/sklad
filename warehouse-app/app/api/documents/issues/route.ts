import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueDocumentSchema } from "@/lib/validators/document";
import { createIssueDocument } from "@/lib/services/issue.service";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role as Role, "createDocuments")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = issueDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const doc = await createIssueDocument(parsed.data, session.user.id!);
    return NextResponse.json(doc, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
