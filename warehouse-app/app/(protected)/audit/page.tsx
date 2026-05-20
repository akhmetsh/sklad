import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { AuditClient } from "./AuditClient";

export default async function AuditPage() {
  await requireRole(["ADMIN", "MANAGER"]);

  const logs = await db.auditLog.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <AuditClient
      initial={logs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        userName: log.user.name ?? "—",
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
      }))}
    />
  );
}
