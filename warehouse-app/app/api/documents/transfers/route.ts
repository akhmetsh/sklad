import { NextRequest, NextResponse } from "next/server";
import { transferDocumentSchema } from "@/lib/validators/document";
import { createTransferDocument } from "@/lib/services/transfer.service";
import { DocumentError } from "@/lib/services/errors";
import { requirePermission, badRequest } from "@/lib/api/helpers";

export async function POST(req: NextRequest) {
  const r = await requirePermission("createDocuments");
  if ("response" in r) return r.response;

  const parsed = transferDocumentSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  try {
    const doc = await createTransferDocument(parsed.data, r.session.user.id!);
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    if (e instanceof DocumentError) return badRequest(e.message, e.status);
    return badRequest("Құжатты жасау мүмкін емес", 500);
  }
}
