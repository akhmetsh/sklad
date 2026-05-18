import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { ReceiptDocumentInput } from "@/lib/validators/document";
import { Decimal } from "@prisma/client/runtime/library";

function generateDocNumber(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export async function createReceiptDocument(
  input: ReceiptDocumentInput,
  userId: string
) {
  const doc = await db.receiptDocument.create({
    data: {
      documentNumber: generateDocNumber("REC"),
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      date: input.date,
      comment: input.comment,
      createdById: userId,
      status: "DRAFT",
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          storageLocationId: item.storageLocationId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          comment: item.comment,
        })),
      },
    },
    include: { items: true },
  });

  await logAudit({
    userId,
    action: "CREATE",
    entityType: "ReceiptDocument",
    entityId: doc.id,
    newValue: { documentNumber: doc.documentNumber, status: doc.status },
  });

  return doc;
}

export async function confirmReceiptDocument(docId: string, userId: string) {
  const doc = await db.receiptDocument.findUnique({
    where: { id: docId },
    include: { items: true },
  });

  if (!doc) throw new Error("Документ не найден");
  if (doc.status !== "DRAFT") throw new Error("Документ уже обработан");

  await db.$transaction(async (tx) => {
    await tx.receiptDocument.update({
      where: { id: docId },
      data: { status: "CONFIRMED" },
    });

    await tx.stockMovement.createMany({
      data: doc.items.map((item) => ({
        productId: item.productId,
        warehouseId: doc.warehouseId,
        storageLocationId: item.storageLocationId,
        quantityChange: new Decimal(item.quantity.toString()),
        movementType: "RECEIPT",
        sourceDocumentType: "ReceiptDocument",
        sourceDocumentId: doc.id,
        createdById: userId,
        comment: item.comment,
      })),
    });
  });

  await logAudit({
    userId,
    action: "CONFIRM",
    entityType: "ReceiptDocument",
    entityId: docId,
    newValue: { status: "CONFIRMED" },
  });
}
