import { NextRequest, NextResponse } from "next/server";
import { cancelTransferDocument } from "@/lib/services/transfer.service";
import { DocumentError } from "@/lib/services/errors";
import { requirePermission, badRequest } from "@/lib/api/helpers";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("createDocuments");
  if ("response" in r) return r.response;

  try {
    await cancelTransferDocument(params.id, r.session.user.id!);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DocumentError) return badRequest(e.message, e.status);
    return badRequest("Болдырмау мүмкін емес", 500);
  }
}
