import { db } from "@/lib/db";

type DocType = "REC" | "ISS" | "TRF";

/**
 * Generate the next document number in the format `<PREFIX>-<YYYY>-<NNNNN>`.
 * Counts existing documents of the same type for the current year and increments.
 *
 * Note: not strictly race-safe — two concurrent calls can produce the same number.
 * The DB-level unique constraint on `documentNumber` catches the collision.
 * Callers should handle the unique-constraint error and retry.
 */
export async function nextDocumentNumber(prefix: DocType): Promise<string> {
  const year = new Date().getFullYear();
  const search = `${prefix}-${year}-`;

  const count = await (
    prefix === "REC" ? db.receiptDocument.count({ where: { documentNumber: { startsWith: search } } })
    : prefix === "ISS" ? db.issueDocument.count({ where: { documentNumber: { startsWith: search } } })
    : db.transferDocument.count({ where: { documentNumber: { startsWith: search } } })
  );

  return `${search}${String(count + 1).padStart(5, "0")}`;
}
