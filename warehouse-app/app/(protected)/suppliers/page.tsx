import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { SuppliersClient } from "./SuppliersClient";

export default async function SuppliersPage() {
  await requireRole(["ADMIN", "STOREKEEPER"]);
  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { receipts: true } } },
  });

  return (
    <SuppliersClient
      initial={suppliers.map((s) => ({
        id: s.id, name: s.name, contactPerson: s.contactPerson, phone: s.phone, email: s.email,
        address: s.address, description: s.description, receiptsCount: s._count.receipts,
      }))}
    />
  );
}
