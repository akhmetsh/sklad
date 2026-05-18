import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { checkSufficientStock } from "@/lib/services/stock.service";
import type { TransferDocumentInput } from "@/lib/validators/document";
import { Decimal } from "@prisma/client/runtime/library";

function generateDocNumber(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export async function createTransferDocument(
  input: TransferDocumentInput,
  userId: string
) {
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new Error("Склад отправления и назначения должны отличаться");
  }

  const doc = await db.transferDocument.create({
    data: {
      documentNumber: generateDocNumber("TRF"),
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      date: input.date,
      comment: input.comment,
      createdById: userId,
      status: "DRAFT",
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          fromStorageLocationId: item.fromStorageLocationId,
          toStorageLocationId: item.toStorageLocationId,
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
    entityType: "TransferDocument",
    entityId: doc.id,
    newValue: { documentNumber: doc.documentNumber },
  });

  return doc;
}

export async function confirmTransferDocument(docId: string, userId: string) {
  const doc = await db.transferDocument.findUnique({
    where: { id: docId },
    include: { items: true },
  });

  if (!doc) throw new Error("Документ не найден");
  if (doc.status !== "DRAFT") throw new Error("Документ уже обработан");

  for (const item of doc.items) {
    const sufficient = await checkSufficientStock(
      item.productId,
      doc.fromWarehouseId,
      item.fromStorageLocationId,
      new Decimal(item.quantity.toString())
    );
    if (!sufficient) {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      throw new Error(`Недостаточный остаток для товара: ${product?.name}`);
    }
  }

  await db.$transaction(async (tx) => {
    await tx.transferDocument.update({
      where: { id: docId },
      data: { status: "CONFIRMED" },
    });

    const outMovements = doc.items.map((item) => ({
      productId: item.productId,
      warehouseId: doc.fromWarehouseId,
      storageLocationId: item.fromStorageLocationId,
      quantityChange: new Decimal(item.quantity.toString()).negated(),
      movementType: "TRANSFER_OUT" as const,
      sourceDocumentType: "TransferDocument",
      sourceDocumentId: doc.id,
      createdById: userId,
    }));

    const inMovements = doc.items.map((item) => ({
      productId: item.productId,
      warehouseId: doc.toWarehouseId,
      storageLocationId: item.toStorageLocationId,
      quantityChange: new Decimal(item.quantity.toString()),
      movementType: "TRANSFER_IN" as const,
      sourceDocumentType: "TransferDocument",
      sourceDocumentId: doc.id,
      createdById: userId,
    }));

    await tx.stockMovement.createMany({ data: [...outMovements, ...inMovements] });
  });

  await logAudit({
    userId,
    action: "CONFIRM",
    entityType: "TransferDocument",
    entityId: docId,
    newValue: { status: "CONFIRMED" },
  });
}
