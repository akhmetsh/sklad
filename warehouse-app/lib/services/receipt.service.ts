import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { Decimal } from "@prisma/client/runtime/library";
import { nextDocumentNumber } from "./document-number";
import { DocumentError } from "./errors";
import type { ReceiptDocumentInput } from "@/lib/validators/document";

export { DocumentError };

export async function createReceiptDocument(input: ReceiptDocumentInput, userId: string) {
  const documentNumber = await nextDocumentNumber("REC");

  const doc = await db.receiptDocument.create({
    data: {
      documentNumber,
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      date: input.date,
      comment: input.comment || null,
      createdById: userId,
      status: "DRAFT",
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          storageLocationId: item.storageLocationId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          comment: item.comment || null,
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

  if (!doc) throw new DocumentError("Құжат табылмады", 404);
  if (doc.status !== "DRAFT") throw new DocumentError("Құжат расталған немесе болдырылмаған", 409);
  if (doc.items.length === 0) throw new DocumentError("Құжатта позициялар жоқ", 400);

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

export async function cancelReceiptDocument(docId: string, userId: string) {
  const doc = await db.receiptDocument.findUnique({
    where: { id: docId },
    include: { items: { include: { product: true } } },
  });

  if (!doc) throw new DocumentError("Құжат табылмады", 404);
  if (doc.status === "CANCELLED") throw new DocumentError("Құжат бұрыннан болдырылмаған", 409);

  // For CONFIRMED receipts: reversing means subtracting the previously added stock.
  // If subsequent consumption depleted the stock, this would go negative — block.
  if (doc.status === "CONFIRMED") {
    // Check current stock at each receipt location is still >= the receipt qty
    const { getStockBalance } = await import("@/lib/services/stock.service");
    const { Decimal } = await import("@prisma/client/runtime/library");
    for (const item of doc.items) {
      const balance = await getStockBalance(item.productId, doc.warehouseId, item.storageLocationId);
      if (balance.lessThan(new Decimal(item.quantity.toString()))) {
        throw new DocumentError(
          `«${item.product.name}» — қалдық кері қайтаруға жеткіліксіз (қажет: ${item.quantity}, бар: ${balance})`,
          409,
        );
      }
    }

    await db.$transaction(async (tx) => {
      await tx.receiptDocument.update({ where: { id: docId }, data: { status: "CANCELLED" } });
      await tx.stockMovement.createMany({
        data: doc.items.map((item) => ({
          productId: item.productId,
          warehouseId: doc.warehouseId,
          storageLocationId: item.storageLocationId,
          quantityChange: new Decimal(item.quantity.toString()).negated(),
          movementType: "INVENTORY_ADJUSTMENT" as const,
          sourceDocumentType: "ReceiptDocument",
          sourceDocumentId: doc.id,
          createdById: userId,
          comment: "Болдырмау",
        })),
      });
    });
  } else {
    await db.receiptDocument.update({ where: { id: docId }, data: { status: "CANCELLED" } });
  }

  await logAudit({
    userId,
    action: "CANCEL",
    entityType: "ReceiptDocument",
    entityId: docId,
    oldValue: { status: doc.status },
    newValue: { status: "CANCELLED" },
  });
}
