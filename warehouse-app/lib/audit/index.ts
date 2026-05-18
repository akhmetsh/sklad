import { db } from "@/lib/db";

interface AuditParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: object;
  newValue?: object;
  ipAddress?: string;
}

export async function logAudit(params: AuditParams) {
  await db.auditLog.create({ data: params });
}
