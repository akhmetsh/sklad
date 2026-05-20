import { PrismaClient, type Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";

const db = new PrismaClient();

/**
 * Seed a realistic Kazakh-language dataset.
 *
 * What you get:
 * - 3 users (admin / storekeeper / manager)
 * - 5 categories, 5 units, 4 suppliers, 2 warehouses, 7 storage locations
 * - 20 products across realistic categories
 * - ~6 months of activity: 12 receipts, 8 issues, 4 transfers — all confirmed,
 *   producing ~60 stock movements that populate the dashboard, reports and audit log.
 */

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  console.log("Тазалау…");
  await db.stockMovement.deleteMany();
  await db.receiptItem.deleteMany();
  await db.issueItem.deleteMany();
  await db.transferItem.deleteMany();
  await db.receiptDocument.deleteMany();
  await db.issueDocument.deleteMany();
  await db.transferDocument.deleteMany();
  await db.auditLog.deleteMany();
  await db.product.deleteMany();
  await db.storageLocation.deleteMany();
  await db.warehouse.deleteMany();
  await db.category.deleteMany();
  await db.unit.deleteMany();
  await db.supplier.deleteMany();
  await db.user.deleteMany();

  console.log("Пайдаланушыларды құру…");
  const [admin, storekeeper, manager] = await Promise.all([
    db.user.create({
      data: {
        name: "Жанар Қасымова",
        email: "admin@sklad.kz",
        passwordHash: await hash("admin123", 12),
        role: "ADMIN",
      },
    }),
    db.user.create({
      data: {
        name: "Нұрлан Әбілов",
        email: "storekeeper@sklad.kz",
        passwordHash: await hash("store123", 12),
        role: "STOREKEEPER",
      },
    }),
    db.user.create({
      data: {
        name: "Айбек Серікұлы",
        email: "manager@sklad.kz",
        passwordHash: await hash("manager123", 12),
        role: "MANAGER",
      },
    }),
  ]);
  void admin; void manager;

  console.log("Анықтамалықтарды құру…");
  const [catInstruments, catSupplies, catParts, catPackaging, catElectro] = await Promise.all([
    db.category.create({ data: { name: "Құрал-саймандар", description: "Қол және электр құралдары" } }),
    db.category.create({ data: { name: "Шығын материалдары", description: "Май, пленка, қолғаптар" } }),
    db.category.create({ data: { name: "Қосалқы бөлшектер", description: "Бұрандалар, гайкалар, бекіткіштер" } }),
    db.category.create({ data: { name: "Қаптама", description: "Скотч, стрейч-пленка, қораптар" } }),
    db.category.create({ data: { name: "Электрика", description: "Кабельдер, шамдар, ажыратқыштар" } }),
  ]);

  const [uPcs, uKg, uL, uM, uPack] = await Promise.all([
    db.unit.create({ data: { name: "Дана", symbol: "дана" } }),
    db.unit.create({ data: { name: "Килограмм", symbol: "кг" } }),
    db.unit.create({ data: { name: "Литр", symbol: "л" } }),
    db.unit.create({ data: { name: "Метр", symbol: "м" } }),
    db.unit.create({ data: { name: "Қаптама", symbol: "қап" } }),
  ]);
  void uL;

  const [sup1, sup2, sup3, sup4] = await Promise.all([
    db.supplier.create({
      data: {
        name: 'ЖШС «АлматыСнаб»',
        contactPerson: "Ермек Әбдіғалиев",
        phone: "+7 727 327-45-11",
        email: "info@almatysnab.kz",
        address: "Алматы қ., Алмалы көш., 14",
      },
    }),
    db.supplier.create({
      data: {
        name: 'ЖШС «ҚазТехСнаб»',
        contactPerson: "Динара Маханова",
        phone: "+7 727 244-19-08",
        email: "sales@kazteh.kz",
        address: "Алматы қ., Сейфуллин даң., 187",
      },
    }),
    db.supplier.create({
      data: {
        name: 'ЖК «Сейтқали Б.»',
        contactPerson: "Берік Сейтқали",
        phone: "+7 701 555-23-90",
        email: "berik.s@gmail.com",
      },
    }),
    db.supplier.create({
      data: {
        name: 'ЖШС «ИндустриалЛоджистикс»',
        contactPerson: "Алмас Тұрсынов",
        phone: "+7 727 311-78-45",
        email: "office@indlog.kz",
        address: "Алматы қ., Райымбек даң., 250",
      },
    }),
  ]);

  console.log("Қоймалар мен сақтау орындары…");
  const [wh1, wh2] = await Promise.all([
    db.warehouse.create({ data: { name: "Орталық қойма", address: "Алматы қ., Райымбек даң., 312" } }),
    db.warehouse.create({ data: { name: "Филиал қоймасы №2", address: "Алматы қ., Толе би көш., 87" } }),
  ]);

  const [locA1, locA2, locB1, locB2, locC1, locX1, locX2] = await Promise.all([
    db.storageLocation.create({ data: { warehouseId: wh1.id, code: "A-01", name: "А сөресі, 1-секция" } }),
    db.storageLocation.create({ data: { warehouseId: wh1.id, code: "A-02", name: "А сөресі, 2-секция" } }),
    db.storageLocation.create({ data: { warehouseId: wh1.id, code: "B-01", name: "Б сөресі, 1-секция" } }),
    db.storageLocation.create({ data: { warehouseId: wh1.id, code: "B-02", name: "Б сөресі, 2-секция" } }),
    db.storageLocation.create({ data: { warehouseId: wh1.id, code: "C-01", name: "Электрика бөлмесі" } }),
    db.storageLocation.create({ data: { warehouseId: wh2.id, code: "X-01", name: "Х аймағы, ұя 1" } }),
    db.storageLocation.create({ data: { warehouseId: wh2.id, code: "X-02", name: "Х аймағы, ұя 2" } }),
  ]);

  console.log("Тауарларды құру…");
  const products = await Promise.all([
    db.product.create({ data: { name: "Электр бұрғы Bosch 750 Вт", sku: "DRILL-BOSCH-750", barcode: "4047024198302", categoryId: catInstruments.id, unitId: uPcs.id, minStock: new Decimal(2), description: "Кәсіби қол бұрғысы" } }),
    db.product.create({ data: { name: "Перфоратор Makita HR2470", sku: "PERF-MKT-HR2470", barcode: "0088381094719", categoryId: catInstruments.id, unitId: uPcs.id, minStock: new Decimal(1) } }),
    db.product.create({ data: { name: "Бұрауыш жинағы (32 дана)", sku: "SCREW-SET-32", barcode: "5901234567890", categoryId: catInstruments.id, unitId: uPcs.id, minStock: new Decimal(5) } }),
    db.product.create({ data: { name: "Балға 500 г", sku: "HAMMER-500", barcode: "1234567890128", categoryId: catInstruments.id, unitId: uPcs.id, minStock: new Decimal(10) } }),
    db.product.create({ data: { name: "Рулетка 5 м", sku: "TAPE-MEAS-5M", barcode: "4051453123456", categoryId: catInstruments.id, unitId: uPcs.id, minStock: new Decimal(15) } }),

    db.product.create({ data: { name: "Индустриалды май И-20А", sku: "OIL-I20A", barcode: "4607034000156", categoryId: catSupplies.id, unitId: uKg.id, minStock: new Decimal(50) } }),
    db.product.create({ data: { name: "Литий майы (ЛИТОЛ-24)", sku: "GREASE-LITOL-24", barcode: "4607034000163", categoryId: catSupplies.id, unitId: uKg.id, minStock: new Decimal(20) } }),
    db.product.create({ data: { name: "Латекс қолғап (100 дана)", sku: "GLOVE-LATEX-100", barcode: "8901234567893", categoryId: catSupplies.id, unitId: uPack.id, minStock: new Decimal(10) } }),
    db.product.create({ data: { name: "Тазартқыш сұйықтық 5 л", sku: "CLEAN-5L", barcode: "4660000123456", categoryId: catSupplies.id, unitId: uPack.id, minStock: new Decimal(30) } }),

    db.product.create({ data: { name: "Болт М8×40 DIN933 (мырыш)", sku: "BOLT-M8X40", barcode: "4250000000018", categoryId: catParts.id, unitId: uPcs.id, minStock: new Decimal(200) } }),
    db.product.create({ data: { name: "Гайка М8 DIN934 (мырыш)", sku: "NUT-M8", barcode: "4250000000025", categoryId: catParts.id, unitId: uPcs.id, minStock: new Decimal(200) } }),
    db.product.create({ data: { name: "Шайба М8 DIN125 (мырыш)", sku: "WASHER-M8", barcode: "4250000000032", categoryId: catParts.id, unitId: uPcs.id, minStock: new Decimal(300) } }),
    db.product.create({ data: { name: "Саморез 4,2×32 (фосфат)", sku: "SCREW-42X32", barcode: "4250000000049", categoryId: catParts.id, unitId: uPack.id, minStock: new Decimal(15) } }),

    db.product.create({ data: { name: "Қаптама скотч 50 мм × 66 м", sku: "TAPE-PACK-50", barcode: "4607123450012", categoryId: catPackaging.id, unitId: uPack.id, minStock: new Decimal(25) } }),
    db.product.create({ data: { name: "Стрейч-пленка 500 мм × 200 м", sku: "STRETCH-500", barcode: "4607123450029", categoryId: catPackaging.id, unitId: uPack.id, minStock: new Decimal(15) } }),
    db.product.create({ data: { name: "Қатыспалы қорап (60×40×40)", sku: "BOX-604040", barcode: "4607123450036", categoryId: catPackaging.id, unitId: uPcs.id, minStock: new Decimal(50) } }),

    db.product.create({ data: { name: "NYM кабелі 3×2,5 мм²", sku: "CABLE-NYM-3X25", barcode: "4012345600015", categoryId: catElectro.id, unitId: uM.id, minStock: new Decimal(50) } }),
    db.product.create({ data: { name: "LED шамы E27 9 Вт", sku: "LED-E27-9W", barcode: "4012345600022", categoryId: catElectro.id, unitId: uPcs.id, minStock: new Decimal(40) } }),
    db.product.create({ data: { name: "Розетка Schneider 16А", sku: "OUTLET-SCH-16", barcode: "3606480123456", categoryId: catElectro.id, unitId: uPcs.id, minStock: new Decimal(20) } }),
    db.product.create({ data: { name: "Автоматты ажыратқыш C16", sku: "BREAKER-C16", barcode: "3606480123463", categoryId: catElectro.id, unitId: uPcs.id, minStock: new Decimal(10) } }),
  ]);

  const [pDrill, pPerf, pScrew, pHammer, pTape, pOil, pGrease, pGlove, pClean,
         pBolt, pNut, pWasher, pSaSc, pPackTape, pStretch, pBox,
         pCable, pLed, pOutlet, pBreaker] = products;

  console.log("Құжаттарды жасау және растау…");

  let recCounter = 0;
  let issCounter = 0;
  let trfCounter = 0;
  const year = new Date().getFullYear();
  const nextRec = () => `REC-${year}-${String(++recCounter).padStart(5, "0")}`;
  const nextIss = () => `ISS-${year}-${String(++issCounter).padStart(5, "0")}`;
  const nextTrf = () => `TRF-${year}-${String(++trfCounter).padStart(5, "0")}`;

  type Prod = typeof pDrill;

  async function confirmReceipt(opts: {
    daysOff: number;
    supplierId: string;
    warehouseId: string;
    comment?: string;
    items: { product: Prod; locationId: string; quantity: number; unitPrice?: number }[];
  }) {
    const date = daysAgo(opts.daysOff);
    const doc = await db.receiptDocument.create({
      data: {
        documentNumber: nextRec(),
        supplierId: opts.supplierId,
        warehouseId: opts.warehouseId,
        date,
        comment: opts.comment ?? null,
        status: "CONFIRMED",
        createdById: storekeeper.id,
        createdAt: date,
        items: {
          create: opts.items.map((it) => ({
            productId: it.product.id,
            storageLocationId: it.locationId,
            quantity: new Decimal(it.quantity),
            unitPrice: it.unitPrice !== undefined ? new Decimal(it.unitPrice) : null,
          })),
        },
      },
    });
    await db.stockMovement.createMany({
      data: opts.items.map((it) => ({
        productId: it.product.id,
        warehouseId: opts.warehouseId,
        storageLocationId: it.locationId,
        quantityChange: new Decimal(it.quantity),
        movementType: "RECEIPT" as const,
        sourceDocumentType: "ReceiptDocument",
        sourceDocumentId: doc.id,
        createdById: storekeeper.id,
        createdAt: date,
      })),
    });
    await db.auditLog.createMany({
      data: [
        { userId: storekeeper.id, action: "CREATE", entityType: "ReceiptDocument", entityId: doc.id, createdAt: date, newValue: { documentNumber: doc.documentNumber } as Prisma.JsonObject },
        { userId: storekeeper.id, action: "CONFIRM", entityType: "ReceiptDocument", entityId: doc.id, createdAt: new Date(date.getTime() + 60_000), newValue: { status: "CONFIRMED" } as Prisma.JsonObject },
      ],
    });
  }

  async function confirmIssue(opts: {
    daysOff: number;
    warehouseId: string;
    recipientName: string;
    comment?: string;
    items: { product: Prod; locationId: string; quantity: number }[];
  }) {
    const date = daysAgo(opts.daysOff);
    const doc = await db.issueDocument.create({
      data: {
        documentNumber: nextIss(),
        warehouseId: opts.warehouseId,
        recipientName: opts.recipientName,
        date,
        comment: opts.comment ?? null,
        status: "CONFIRMED",
        createdById: storekeeper.id,
        createdAt: date,
        items: {
          create: opts.items.map((it) => ({
            productId: it.product.id,
            storageLocationId: it.locationId,
            quantity: new Decimal(it.quantity),
          })),
        },
      },
    });
    await db.stockMovement.createMany({
      data: opts.items.map((it) => ({
        productId: it.product.id,
        warehouseId: opts.warehouseId,
        storageLocationId: it.locationId,
        quantityChange: new Decimal(-it.quantity),
        movementType: "ISSUE" as const,
        sourceDocumentType: "IssueDocument",
        sourceDocumentId: doc.id,
        createdById: storekeeper.id,
        createdAt: date,
      })),
    });
    await db.auditLog.createMany({
      data: [
        { userId: storekeeper.id, action: "CREATE", entityType: "IssueDocument", entityId: doc.id, createdAt: date, newValue: { documentNumber: doc.documentNumber } as Prisma.JsonObject },
        { userId: storekeeper.id, action: "CONFIRM", entityType: "IssueDocument", entityId: doc.id, createdAt: new Date(date.getTime() + 60_000), newValue: { status: "CONFIRMED" } as Prisma.JsonObject },
      ],
    });
  }

  async function confirmTransfer(opts: {
    daysOff: number;
    fromWarehouseId: string;
    toWarehouseId: string;
    comment?: string;
    items: { product: Prod; fromLocationId: string; toLocationId: string; quantity: number }[];
  }) {
    const date = daysAgo(opts.daysOff);
    const doc = await db.transferDocument.create({
      data: {
        documentNumber: nextTrf(),
        fromWarehouseId: opts.fromWarehouseId,
        toWarehouseId: opts.toWarehouseId,
        date,
        comment: opts.comment ?? null,
        status: "CONFIRMED",
        createdById: storekeeper.id,
        createdAt: date,
        items: {
          create: opts.items.map((it) => ({
            productId: it.product.id,
            fromStorageLocationId: it.fromLocationId,
            toStorageLocationId: it.toLocationId,
            quantity: new Decimal(it.quantity),
          })),
        },
      },
    });
    const movements: Prisma.StockMovementCreateManyInput[] = [];
    for (const it of opts.items) {
      movements.push({
        productId: it.product.id,
        warehouseId: opts.fromWarehouseId,
        storageLocationId: it.fromLocationId,
        quantityChange: new Decimal(-it.quantity),
        movementType: "TRANSFER_OUT",
        sourceDocumentType: "TransferDocument",
        sourceDocumentId: doc.id,
        createdById: storekeeper.id,
        createdAt: date,
      });
      movements.push({
        productId: it.product.id,
        warehouseId: opts.toWarehouseId,
        storageLocationId: it.toLocationId,
        quantityChange: new Decimal(it.quantity),
        movementType: "TRANSFER_IN",
        sourceDocumentType: "TransferDocument",
        sourceDocumentId: doc.id,
        createdById: storekeeper.id,
        createdAt: date,
      });
    }
    await db.stockMovement.createMany({ data: movements });
    await db.auditLog.createMany({
      data: [
        { userId: storekeeper.id, action: "CREATE", entityType: "TransferDocument", entityId: doc.id, createdAt: date, newValue: { documentNumber: doc.documentNumber } as Prisma.JsonObject },
        { userId: storekeeper.id, action: "CONFIRM", entityType: "TransferDocument", entityId: doc.id, createdAt: new Date(date.getTime() + 60_000), newValue: { status: "CONFIRMED" } as Prisma.JsonObject },
      ],
    });
  }

  // === Receipts (12) over 6 months ===
  await confirmReceipt({
    daysOff: 175, supplierId: sup1.id, warehouseId: wh1.id, comment: "Жоспарлы тоқсандық жеткізу",
    items: [
      { product: pDrill, locationId: locA1.id, quantity: 6, unitPrice: 38000 },
      { product: pPerf, locationId: locA1.id, quantity: 4, unitPrice: 92000 },
      { product: pBolt, locationId: locB1.id, quantity: 800, unitPrice: 35 },
      { product: pNut, locationId: locB1.id, quantity: 800, unitPrice: 22 },
    ],
  });
  await confirmReceipt({
    daysOff: 162, supplierId: sup2.id, warehouseId: wh1.id, comment: "Электрика тауарлары",
    items: [
      { product: pCable, locationId: locC1.id, quantity: 400, unitPrice: 320 },
      { product: pLed, locationId: locC1.id, quantity: 80, unitPrice: 1100 },
      { product: pOutlet, locationId: locC1.id, quantity: 40, unitPrice: 2800 },
      { product: pBreaker, locationId: locC1.id, quantity: 25, unitPrice: 3200 },
    ],
  });
  await confirmReceipt({
    daysOff: 150, supplierId: sup3.id, warehouseId: wh1.id,
    items: [
      { product: pHammer, locationId: locA2.id, quantity: 20, unitPrice: 2400 },
      { product: pTape, locationId: locA2.id, quantity: 30, unitPrice: 1400 },
      { product: pScrew, locationId: locA2.id, quantity: 15, unitPrice: 7800 },
    ],
  });
  await confirmReceipt({
    daysOff: 135, supplierId: sup4.id, warehouseId: wh1.id, comment: "Шығын материалдары",
    items: [
      { product: pOil, locationId: locB2.id, quantity: 200, unitPrice: 680 },
      { product: pGrease, locationId: locB2.id, quantity: 100, unitPrice: 1200 },
      { product: pGlove, locationId: locB1.id, quantity: 50, unitPrice: 850 },
      { product: pClean, locationId: locB2.id, quantity: 80, unitPrice: 1500 },
    ],
  });
  await confirmReceipt({
    daysOff: 120, supplierId: sup1.id, warehouseId: wh2.id,
    items: [
      { product: pPackTape, locationId: locX1.id, quantity: 60, unitPrice: 1200 },
      { product: pStretch, locationId: locX1.id, quantity: 40, unitPrice: 2200 },
      { product: pBox, locationId: locX2.id, quantity: 120, unitPrice: 450 },
    ],
  });
  await confirmReceipt({
    daysOff: 105, supplierId: sup2.id, warehouseId: wh1.id, comment: "Қосалқы крепеж",
    items: [
      { product: pBolt, locationId: locB1.id, quantity: 500, unitPrice: 38 },
      { product: pNut, locationId: locB1.id, quantity: 500, unitPrice: 24 },
      { product: pWasher, locationId: locB1.id, quantity: 1000, unitPrice: 8 },
      { product: pSaSc, locationId: locB1.id, quantity: 25, unitPrice: 2200 },
    ],
  });
  await confirmReceipt({
    daysOff: 88, supplierId: sup3.id, warehouseId: wh1.id,
    items: [
      { product: pHammer, locationId: locA2.id, quantity: 15, unitPrice: 2500 },
      { product: pTape, locationId: locA2.id, quantity: 25, unitPrice: 1450 },
    ],
  });
  await confirmReceipt({
    daysOff: 70, supplierId: sup1.id, warehouseId: wh1.id,
    items: [
      { product: pDrill, locationId: locA1.id, quantity: 3, unitPrice: 39000 },
      { product: pPerf, locationId: locA1.id, quantity: 2, unitPrice: 95000 },
    ],
  });
  await confirmReceipt({
    daysOff: 55, supplierId: sup4.id, warehouseId: wh1.id, comment: "Жаңа партия май",
    items: [
      { product: pOil, locationId: locB2.id, quantity: 150, unitPrice: 720 },
      { product: pGrease, locationId: locB2.id, quantity: 60, unitPrice: 1250 },
    ],
  });
  await confirmReceipt({
    daysOff: 40, supplierId: sup2.id, warehouseId: wh1.id,
    items: [
      { product: pCable, locationId: locC1.id, quantity: 200, unitPrice: 335 },
      { product: pLed, locationId: locC1.id, quantity: 60, unitPrice: 1150 },
    ],
  });
  await confirmReceipt({
    daysOff: 22, supplierId: sup1.id, warehouseId: wh2.id, comment: "Филиалға толықтыру",
    items: [
      { product: pPackTape, locationId: locX1.id, quantity: 30, unitPrice: 1250 },
      { product: pBox, locationId: locX2.id, quantity: 80, unitPrice: 470 },
    ],
  });
  await confirmReceipt({
    daysOff: 10, supplierId: sup3.id, warehouseId: wh1.id,
    items: [
      { product: pGlove, locationId: locB1.id, quantity: 40, unitPrice: 900 },
      { product: pClean, locationId: locB2.id, quantity: 50, unitPrice: 1550 },
    ],
  });

  // === Issues (8) ===
  await confirmIssue({
    daysOff: 140, warehouseId: wh1.id, recipientName: "Құрылыс бөлімі",
    items: [
      { product: pDrill, locationId: locA1.id, quantity: 2 },
      { product: pBolt, locationId: locB1.id, quantity: 200 },
      { product: pNut, locationId: locB1.id, quantity: 200 },
    ],
  });
  await confirmIssue({
    daysOff: 125, warehouseId: wh1.id, recipientName: 'ЖШС "СтройКомплекс"',
    items: [
      { product: pOil, locationId: locB2.id, quantity: 50 },
      { product: pGrease, locationId: locB2.id, quantity: 20 },
    ],
  });
  await confirmIssue({
    daysOff: 110, warehouseId: wh1.id, recipientName: "Электр монтаж тобы",
    items: [
      { product: pCable, locationId: locC1.id, quantity: 150 },
      { product: pLed, locationId: locC1.id, quantity: 30 },
      { product: pOutlet, locationId: locC1.id, quantity: 15 },
    ],
  });
  await confirmIssue({
    daysOff: 95, warehouseId: wh1.id, recipientName: "Жөндеу шеберлігі",
    items: [
      { product: pHammer, locationId: locA2.id, quantity: 5 },
      { product: pTape, locationId: locA2.id, quantity: 8 },
      { product: pScrew, locationId: locA2.id, quantity: 4 },
    ],
  });
  await confirmIssue({
    daysOff: 75, warehouseId: wh1.id, recipientName: "Өндірістік цех №3", comment: "Ай сайынғы шығын",
    items: [
      { product: pGlove, locationId: locB1.id, quantity: 15 },
      { product: pClean, locationId: locB2.id, quantity: 25 },
      { product: pOil, locationId: locB2.id, quantity: 40 },
    ],
  });
  await confirmIssue({
    daysOff: 50, warehouseId: wh1.id, recipientName: "Сейтқали Берік (ЖК)",
    items: [
      { product: pBolt, locationId: locB1.id, quantity: 350 },
      { product: pNut, locationId: locB1.id, quantity: 350 },
      { product: pWasher, locationId: locB1.id, quantity: 500 },
    ],
  });
  await confirmIssue({
    daysOff: 30, warehouseId: wh2.id, recipientName: "Қойма филиалы — өзіндік пайдалану",
    items: [
      { product: pPackTape, locationId: locX1.id, quantity: 20 },
      { product: pBox, locationId: locX2.id, quantity: 60 },
    ],
  });
  await confirmIssue({
    daysOff: 5, warehouseId: wh1.id, recipientName: "Күтім бөлімі",
    items: [
      { product: pBreaker, locationId: locC1.id, quantity: 10 },
      { product: pCable, locationId: locC1.id, quantity: 80 },
    ],
  });

  // === Transfers (4) ===
  await confirmTransfer({
    daysOff: 130, fromWarehouseId: wh1.id, toWarehouseId: wh2.id, comment: "Филиал қоймасына крепеж",
    items: [
      { product: pBolt, fromLocationId: locB1.id, toLocationId: locX1.id, quantity: 200 },
      { product: pNut, fromLocationId: locB1.id, toLocationId: locX1.id, quantity: 200 },
    ],
  });
  await confirmTransfer({
    daysOff: 90, fromWarehouseId: wh1.id, toWarehouseId: wh2.id, comment: "Май және қаптама",
    items: [
      { product: pOil, fromLocationId: locB2.id, toLocationId: locX2.id, quantity: 30 },
      { product: pStretch, fromLocationId: locX1.id, toLocationId: locX2.id, quantity: 10 },
    ],
  });
  await confirmTransfer({
    daysOff: 45, fromWarehouseId: wh1.id, toWarehouseId: wh2.id,
    items: [
      { product: pLed, fromLocationId: locC1.id, toLocationId: locX1.id, quantity: 20 },
    ],
  });
  await confirmTransfer({
    daysOff: 15, fromWarehouseId: wh2.id, toWarehouseId: wh1.id, comment: "Артық қалдықтарды орталыққа қайтару",
    items: [
      { product: pBox, fromLocationId: locX2.id, toLocationId: locB2.id, quantity: 30 },
    ],
  });

  // === Drafts ===
  console.log("Жобаларды құру…");
  const draftRec = await db.receiptDocument.create({
    data: {
      documentNumber: nextRec(),
      supplierId: sup1.id,
      warehouseId: wh1.id,
      date: daysAgo(2),
      comment: "Жоспарлы жеткізу — растауды күтуде",
      status: "DRAFT",
      createdById: storekeeper.id,
      items: {
        create: [
          { productId: pDrill.id, storageLocationId: locA1.id, quantity: new Decimal(2), unitPrice: new Decimal(40000) },
          { productId: pPerf.id, storageLocationId: locA1.id, quantity: new Decimal(1), unitPrice: new Decimal(98000) },
        ],
      },
    },
  });
  await db.auditLog.create({
    data: {
      userId: storekeeper.id, action: "CREATE", entityType: "ReceiptDocument",
      entityId: draftRec.id, newValue: { documentNumber: draftRec.documentNumber } as Prisma.JsonObject,
    },
  });

  const draftIss = await db.issueDocument.create({
    data: {
      documentNumber: nextIss(),
      warehouseId: wh1.id,
      recipientName: "Жөндеу тобы (3-смена)",
      date: daysAgo(1),
      status: "DRAFT",
      createdById: storekeeper.id,
      items: {
        create: [
          { productId: pHammer.id, storageLocationId: locA2.id, quantity: new Decimal(3) },
          { productId: pTape.id, storageLocationId: locA2.id, quantity: new Decimal(5) },
        ],
      },
    },
  });
  await db.auditLog.create({
    data: {
      userId: storekeeper.id, action: "CREATE", entityType: "IssueDocument",
      entityId: draftIss.id, newValue: { documentNumber: draftIss.documentNumber } as Prisma.JsonObject,
    },
  });

  console.log("Дайын!");
  const [productCount, recCount, issCount, trfCount, movementCount, auditCount] = await Promise.all([
    db.product.count(),
    db.receiptDocument.count(),
    db.issueDocument.count(),
    db.transferDocument.count(),
    db.stockMovement.count(),
    db.auditLog.count(),
  ]);
  console.log(`  Тауарлар: ${productCount}`);
  console.log(`  Кірістер: ${recCount}, Шығыстар: ${issCount}, Аударымдар: ${trfCount}`);
  console.log(`  Қозғалыстар: ${movementCount}`);
  console.log(`  Журнал жазбалары: ${auditCount}`);
  console.log("");
  console.log("Кіру деректері:");
  console.log("  admin@sklad.kz / admin123  (Әкімші)");
  console.log("  storekeeper@sklad.kz / store123  (Қоймашы)");
  console.log("  manager@sklad.kz / manager123  (Менеджер)");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
