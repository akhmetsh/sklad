import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { confirmIssueDocument } from "@/lib/services/issue.service";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role as Role, "createDocuments")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await confirmIssueDocument(params.id, session.user.id!);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
