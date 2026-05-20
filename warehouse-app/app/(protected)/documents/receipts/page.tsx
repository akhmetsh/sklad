import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ReceiptsClient } from "./ReceiptsClient";

export default async function ReceiptsPage() {
  await getSession();

  const docs = await db.receiptDocument.findMany({
    include: {
      supplier: { select: { name: true } },
      warehouse: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ReceiptsClient
      initial={docs.map((d) => ({
        id: d.id,
        documentNumber: d.documentNumber,
        date: d.date.toISOString(),
        supplierName: d.supplier.name,
        warehouseName: d.warehouse.name,
        itemsCount: d._count.items,
        status: d.status,
        createdByName: d.createdBy.name ?? "",
      }))}
    />
  );
}
