import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  const r = await requireSession();
  if ("response" in r) return r.response;

  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  // Try exact match on barcode first, then SKU (helpful for hand-entered SKUs)
  const product = await db.product.findFirst({
    where: {
      isActive: true,
      OR: [{ barcode: code }, { sku: code }],
    },
    select: { id: true, name: true, sku: true, barcode: true, unit: { select: { symbol: true } } },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}
