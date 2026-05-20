import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { IssuesClient } from "./IssuesClient";

export default async function IssuesPage() {
  await getSession();

  const docs = await db.issueDocument.findMany({
    include: {
      warehouse: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <IssuesClient
      initial={docs.map((d) => ({
        id: d.id,
        documentNumber: d.documentNumber,
        date: d.date.toISOString(),
        recipientName: d.recipientName,
        warehouseName: d.warehouse.name,
        itemsCount: d._count.items,
        status: d.status,
        createdByName: d.createdBy.name ?? "",
      }))}
    />
  );
}
