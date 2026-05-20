import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { Decimal } from "@prisma/client/runtime/library";
import { checkSufficientStock, getStockBalance } from "@/lib/services/stock.service";
import { nextDocumentNumber } from "./document-number";
import { DocumentError } from "./errors";
import type { IssueDocumentInput } from "@/lib/validators/document";

export async function createIssueDocument(input: IssueDocumentInput, userId: string) {
  const documentNumber = await nextDocumentNumber("ISS");

  const doc = await db.issueDocument.create({
    data: {
      documentNumber,
      warehouseId: input.warehouseId,
      date: input.date,
      recipientName: input.recipientName,
      comment: input.comment || null,
      createdById: userId,
      status: "DRAFT",
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          storageLocationId: item.storageLocationId,
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
    entityType: "IssueDocument",
    entityId: doc.id,
    newValue: { documentNumber: doc.documentNumber },
  });

  return doc;
}

export async function confirmIssueDocument(docId: string, userId: string) {
  const doc = await db.issueDocument.findUnique({
    where: { id: docId },
    include: { items: { include: { product: true } } },
  });

  if (!doc) throw new DocumentError("Құжат табылмады", 404);
  if (doc.status !== "DRAFT") throw new DocumentError("Құжат расталған немесе болдырылмаған", 409);
  if (doc.items.length === 0) throw new DocumentError("Құжатта позициялар жоқ", 400);

  // Validate stock for each line
  for (const item of doc.items) {
    const required = new Decimal(item.quantity.toString());
    const sufficient = await checkSufficientStock(
      item.productId,
      doc.warehouseId,
      item.storageLocationId,
      required,
    );
    if (!sufficient) {
      const available = await getStockBalance(item.productId, doc.warehouseId, item.storageLocationId);
      throw new DocumentError(
        `«${item.product.name}» — қалдық жеткіліксіз (қажет: ${required}, бар: ${available})`,
        409,
      );
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

export async function cancelIssueDocument(docId: string, userId: string) {
  const doc = await db.issueDocument.findUnique({
    where: { id: docId },
    include: { items: true },
  });

  if (!doc) throw new DocumentError("Құжат табылмады", 404);
  if (doc.status === "CANCELLED") throw new DocumentError("Құжат бұрыннан болдырылмаған", 409);

  if (doc.status === "CONFIRMED") {
    // Reverse = add back what was issued. Always safe (no negative stock possible).
    await db.$transaction(async (tx) => {
      await tx.issueDocument.update({ where: { id: docId }, data: { status: "CANCELLED" } });
      await tx.stockMovement.createMany({
        data: doc.items.map((item) => ({
          productId: item.productId,
          warehouseId: doc.warehouseId,
          storageLocationId: item.storageLocationId,
          quantityChange: new Decimal(item.quantity.toString()),
          movementType: "INVENTORY_ADJUSTMENT" as const,
          sourceDocumentType: "IssueDocument",
          sourceDocumentId: doc.id,
          createdById: userId,
          comment: "Болдырмау",
        })),
      });
    });
  } else {
    await db.issueDocument.update({ where: { id: docId }, data: { status: "CANCELLED" } });
  }

  await logAudit({
    userId,
    action: "CANCEL",
    entityType: "IssueDocument",
    entityId: docId,
    oldValue: { status: doc.status },
    newValue: { status: "CANCELLED" },
  });
}
