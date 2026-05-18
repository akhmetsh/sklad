import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { checkSufficientStock } from "@/lib/services/stock.service";
import type { IssueDocumentInput } from "@/lib/validators/document";
import { Decimal } from "@prisma/client/runtime/library";

function generateDocNumber(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export async function createIssueDocument(
  input: IssueDocumentInput,
  userId: string
) {
  const doc = await db.issueDocument.create({
    data: {
      documentNumber: generateDocNumber("ISS"),
      warehouseId: input.warehouseId,
      date: input.date,
      recipientName: input.recipientName,
      comment: input.comment,
      createdById: userId,
      status: "DRAFT",
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          storageLocationId: item.storageLocationId,
          quantity: item.quantity,
          comment: item.comment,
        })),
      },
    },
    include: { items: true },
  });

  await logAudit({
    userId,
    action: "CREATE",
    entityType: "IssueDocument",
    entityId: doc.id,
    newValue: { documentNumber: doc.documentNumber },
  });

  return doc;
}

export async function confirmIssueDocument(docId: string, userId: string) {
  const doc = await db.issueDocument.findUnique({
    where: { id: docId },
    include: { items: true },
  });

  if (!doc) throw new Error("Документ не найден");
  if (doc.status !== "DRAFT") throw new Error("Документ уже обработан");

  for (const item of doc.items) {
    const sufficient = await checkSufficientStock(
      item.productId,
      doc.warehouseId,
      item.storageLocationId,
      new Decimal(item.quantity.toString())
    );
    if (!sufficient) {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      throw new Error(`Недостаточный остаток для товара: ${product?.name}`);
    }
  }

  await db.$transaction(async (tx) => {
    await tx.issueDocument.update({
      where: { id: docId },
      data: { status: "CONFIRMED" },
    });

    await tx.stockMovement.createMany({
      data: doc.items.map((item) => ({
        productId: item.productId,
        warehouseId: doc.warehouseId,
        storageLocationId: item.storageLocationId,
        quantityChange: new Decimal(item.quantity.toString()).negated(),
        movementType: "ISSUE",
        sourceDocumentType: "IssueDocument",
        sourceDocumentId: doc.id,
        createdById: userId,
        comment: item.comment,
      })),
    });
  });

  await logAudit({
    userId,
    action: "CONFIRM",
    entityType: "IssueDocument",
    entityId: docId,
    newValue: { status: "CONFIRMED" },
  });
}
