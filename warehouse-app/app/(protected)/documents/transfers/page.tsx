import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { TransfersClient } from "./TransfersClient";

export default async function TransfersPage() {
  await getSession();

  const docs = await db.transferDocument.findMany({
    include: {
      fromWarehouse: { select: { name: true } },
      toWarehouse: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <TransfersClient
      initial={docs.map((d) => ({
        id: d.id,
        documentNumber: d.documentNumber,
        date: d.date.toISOString(),
        fromWarehouseName: d.fromWarehouse.name,
        toWarehouseName: d.toWarehouse.name,
        itemsCount: d._count.items,
        status: d.status,
        createdByName: d.createdBy.name ?? "",
      }))}
    />
  );
}
