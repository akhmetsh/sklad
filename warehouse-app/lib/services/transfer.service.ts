import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { Decimal } from "@prisma/client/runtime/library";
import { checkSufficientStock, getStockBalance } from "@/lib/services/stock.service";
import { nextDocumentNumber } from "./document-number";
import { DocumentError } from "./errors";
import type { TransferDocumentInput } from "@/lib/validators/document";

export async function createTransferDocument(input: TransferDocumentInput, userId: string) {
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new DocumentError("Қоймалар әртүрлі болуы керек", 422);
  }

  const documentNumber = await nextDocumentNumber("TRF");

  const doc = await db.transferDocument.create({
    data: {
      documentNumber,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      date: input.date,
      comment: input.comment || null,
      createdById: userId,
      status: "DRAFT",
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          fromStorageLocationId: item.fromStorageLocationId,
          toStorageLocationId: item.toStorageLocationId,
          quantity: item.quantity,
          comment: item.comment || null,
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
    include: { items: { include: { product: true } } },
  });

  if (!doc) throw new DocumentError("Құжат табылмады", 404);
  if (doc.status !== "DRAFT") throw new DocumentError("Құжат расталған немесе болдырылмаған", 409);
  if (doc.items.length === 0) throw new DocumentError("Құжатта позициялар жоқ", 400);

  // Validate stock on source side
  for (const item of doc.items) {
    const required = new Decimal(item.quantity.toString());
    const sufficient = await checkSufficientStock(
      item.productId,
      doc.fromWarehouseId,
      item.fromStorageLocationId,
      required,
    );
    if (!sufficient) {
      const available = await getStockBalance(item.productId, doc.fromWarehouseId, item.fromStorageLocationId);
      throw new DocumentError(
        `«${item.product.name}» — қалдық жеткіліксіз (қажет: ${required}, бар: ${available})`,
        409,
      );
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

export async function cancelTransferDocument(docId: string, userId: string) {
  const doc = await db.transferDocument.findUnique({
    where: { id: docId },
    include: { items: { include: { product: true } } },
  });

  if (!doc) throw new DocumentError("Құжат табылмады", 404);
  if (doc.status === "CANCELLED") throw new DocumentError("Құжат бұрыннан болдырылмаған", 409);

  if (doc.status === "CONFIRMED") {
    // Reverse: subtract from destination, add back to source.
    for (const item of doc.items) {
      const balance = await getStockBalance(item.productId, doc.toWarehouseId, item.toStorageLocationId);
      if (balance.lessThan(new Decimal(item.quantity.toString()))) {
        throw new DocumentError(
          `«${item.product.name}» — мақсатты орында қалдық жеткіліксіз (қажет: ${item.quantity}, бар: ${balance})`,
          409,
        );
      }
    }

    await db.$transaction(async (tx) => {
      await tx.transferDocument.update({ where: { id: docId }, data: { status: "CANCELLED" } });

      const reverseOut = doc.items.map((item) => ({
        productId: item.productId,
        warehouseId: doc.toWarehouseId,
        storageLocationId: item.toStorageLocationId,
        quantityChange: new Decimal(item.quantity.toString()).negated(),
        movementType: "INVENTORY_ADJUSTMENT" as const,
        sourceDocumentType: "TransferDocument",
        sourceDocumentId: doc.id,
        createdById: userId,
        comment: "Болдырмау",
      }));

      const reverseIn = doc.items.map((item) => ({
        productId: item.productId,
        warehouseId: doc.fromWarehouseId,
        storageLocationId: item.fromStorageLocationId,
        quantityChange: new Decimal(item.quantity.toString()),
        movementType: "INVENTORY_ADJUSTMENT" as const,
        sourceDocumentType: "TransferDocument",
        sourceDocumentId: doc.id,
        createdById: userId,
        comment: "Болдырмау",
      }));

      await tx.stockMovement.createMany({ data: [...reverseOut, ...reverseIn] });
    });
  } else {
    await db.transferDocument.update({ where: { id: docId }, data: { status: "CANCELLED" } });
  }

  await logAudit({
    userId,
    action: "CANCEL",
    entityType: "TransferDocument",
    entityId: docId,
    oldValue: { status: doc.status },
    newValue: { status: "CANCELLED" },
  });
}
