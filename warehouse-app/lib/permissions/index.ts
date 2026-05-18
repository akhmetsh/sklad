import type { Role } from "@prisma/client";

export const PERMISSIONS = {
  manageUsers: ["ADMIN"] as Role[],
  manageReferenceData: ["ADMIN", "STOREKEEPER"] as Role[],
  createDocuments: ["ADMIN", "STOREKEEPER"] as Role[],
  viewDocuments: ["ADMIN", "STOREKEEPER", "MANAGER"] as Role[],
  viewStock: ["ADMIN", "STOREKEEPER", "MANAGER"] as Role[],
  viewReports: ["ADMIN", "STOREKEEPER", "MANAGER"] as Role[],
  viewAuditLog: ["ADMIN", "MANAGER"] as Role[],
} as const;

export function can(userRole: Role, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(userRole);
}
