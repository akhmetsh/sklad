import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { requireSession } from "@/lib/api/helpers";
import type { Role } from "@prisma/client";

export interface SearchResult {
  kind: "product" | "receipt" | "issue" | "transfer" | "user";
  id: string;
  label: string;
  hint?: string;
  href: string;
}

export async function GET(req: NextRequest) {
  const r = await requireSession();
  if ("response" in r) return r.response;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const role = r.session.user.role as Role;
  const insensitive = { contains: q, mode: "insensitive" as const };
  const results: SearchResult[] = [];

  // Products
  const products = await db.product.findMany({
    where: {
      isActive: true,
      OR: [{ name: insensitive }, { sku: insensitive }, { barcode: insensitive }],
    },
    take: 6,
    select: { id: true, name: true, sku: true },
  });
  for (const p of products) {
    results.push({ kind: "product", id: p.id, label: p.name, hint: p.sku, href: `/products/${p.id}` });
  }

  // Documents (only if user can view them)
  if (can(role, "viewDocuments")) {
    const [receipts, issues, transfers] = await Promise.all([
      db.receiptDocument.findMany({
        where: { OR: [{ documentNumber: insensitive }, { supplier: { name: insensitive } }] },
        take: 4,
        select: { id: true, documentNumber: true, supplier: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.issueDocument.findMany({
        where: { OR: [{ documentNumber: insensitive }, { recipientName: insensitive }] },
        take: 4,
        select: { id: true, documentNumber: true, recipientName: true },
        orderBy: { createdAt: "desc" },
      }),
      db.transferDocument.findMany({
        where: {
          OR: [
            { documentNumber: insensitive },
            { fromWarehouse: { name: insensitive } },
            { toWarehouse: { name: insensitive } },
          ],
        },
        take: 4,
        select: {
          id: true, documentNumber: true,
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    for (const d of receipts) results.push({ kind: "receipt", id: d.id, label: d.documentNumber, hint: d.supplier.name, href: `/documents/receipts/${d.id}` });
    for (const d of issues) results.push({ kind: "issue", id: d.id, label: d.documentNumber, hint: d.recipientName, href: `/documents/issues/${d.id}` });
    for (const d of transfers) results.push({ kind: "transfer", id: d.id, label: d.documentNumber, hint: `${d.fromWarehouse.name} → ${d.toWarehouse.name}`, href: `/documents/transfers/${d.id}` });
  }

  // Users (admin only)
  if (can(role, "manageUsers")) {
    const users = await db.user.findMany({
      where: { OR: [{ name: insensitive }, { email: insensitive }] },
      take: 4,
      select: { id: true, name: true, email: true },
    });
    for (const u of users) {
      results.push({ kind: "user", id: u.id, label: u.name ?? u.email, hint: u.email, href: `/users` });
    }
  }

  return NextResponse.json({ results });
}
