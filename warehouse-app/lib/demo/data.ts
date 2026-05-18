import type { DemoState } from "./types";

export const INITIAL_STATE: DemoState = {
  notification: null,

  users: [
    { id: "u-admin", name: "Администратор", email: "admin@sklad.kz", role: "ADMIN", isActive: true, createdAt: "2026-04-01T08:00:00Z" },
    { id: "u-store", name: "Петров Николай", email: "storekeeper@sklad.kz", role: "STOREKEEPER", isActive: true, createdAt: "2026-04-02T08:00:00Z" },
    { id: "u-mgr", name: "Сидоров Андрей", email: "manager@sklad.kz", role: "MANAGER", isActive: true, createdAt: "2026-04-03T08:00:00Z" },
  ],

  categories: [
    { id: "cat-1", name: "Инструменты", description: "Ручной и электрический инструмент", isActive: true },
    { id: "cat-2", name: "Расходные материалы", description: "Смазки, кабели, перчатки", isActive: true },
    { id: "cat-3", name: "Запасные части", description: "Болты, гайки, крепёж", isActive: true },
    { id: "cat-4", name: "Упаковка", description: "Скотч, стрейч-плёнка, коробки", isActive: true },
  ],

  units: [
    { id: "un-sht", name: "Штука", symbol: "шт", isActive: true },
    { id: "un-kg", name: "Килограмм", symbol: "кг", isActive: true },
    { id: "un-l", name: "Литр", symbol: "л", isActive: true },
    { id: "un-m", name: "Метр", symbol: "м", isActive: true },
    { id: "un-up", name: "Упаковка", symbol: "уп", isActive: true },
  ],

  warehouses: [
    { id: "wh-1", name: "Главный склад", address: "Алматы, ул. Складская, 1", isActive: true },
    { id: "wh-2", name: "Склад № 2 — Отдел поставок", address: "Алматы, ул. Промышленная, 5", isActive: true },
  ],

  locations: [
    { id: "loc-a1", warehouseId: "wh-1", code: "A-01", name: "Стеллаж A, секция 1", isActive: true },
    { id: "loc-a2", warehouseId: "wh-1", code: "A-02", name: "Стеллаж A, секция 2", isActive: true },
    { id: "loc-b1", warehouseId: "wh-1", code: "B-01", name: "Стеллаж B, секция 1", isActive: true },
    { id: "loc-b2", warehouseId: "wh-1", code: "B-02", name: "Стеллаж B, секция 2", isActive: true },
    { id: "loc-x1", warehouseId: "wh-2", code: "X-01", name: "Зона X, ячейка 1", isActive: true },
    { id: "loc-x2", warehouseId: "wh-2", code: "X-02", name: "Зона X, ячейка 2", isActive: true },
  ],

  suppliers: [
    { id: "sup-1", name: 'ТОО "АлматыСнаб"', contactPerson: "Иванов А.П.", phone: "+7 727 123-45-67", email: "info@almatysnab.kz", address: "Алматы, ул. Торговая, 12", isActive: true },
    { id: "sup-2", name: "ИП Сейткали Б.", contactPerson: "Сейткали Берик", phone: "+7 701 234-56-78", email: "seitkali@mail.ru", isActive: true },
    { id: "sup-3", name: 'ТОО "КазТехСнаб"', contactPerson: "Ахметов Д.С.", phone: "+7 727 987-65-43", email: "kazteh@snab.kz", address: "Алматы, пр. Абая, 55", isActive: true },
  ],

  products: [
    { id: "p-drill", name: "Дрель электрическая 750 Вт", sku: "DRILL-001", categoryId: "cat-1", unitId: "un-sht", minStock: 2, isActive: true, createdAt: "2026-04-05T10:00:00Z" },
    { id: "p-perf", name: "Перфоратор Bosch 850 Вт", sku: "PERF-001", categoryId: "cat-1", unitId: "un-sht", minStock: 1, isActive: true, createdAt: "2026-04-05T10:10:00Z" },
    { id: "p-tape", name: "Скотч упаковочный 50 мм", sku: "TAPE-001", categoryId: "cat-4", unitId: "un-up", minStock: 20, isActive: true, createdAt: "2026-04-06T09:00:00Z" },
    { id: "p-oil", name: "Масло индустриальное И-20А", sku: "OIL-001", categoryId: "cat-2", unitId: "un-kg", minStock: 50, isActive: true, createdAt: "2026-04-06T09:30:00Z" },
    { id: "p-bolt", name: "Болт М8×40 DIN933 (цинк)", sku: "BOLT-001", categoryId: "cat-3", unitId: "un-sht", minStock: 100, isActive: true, createdAt: "2026-04-07T11:00:00Z" },
    { id: "p-nut", name: "Гайка М8 DIN934 (цинк)", sku: "NUT-001", categoryId: "cat-3", unitId: "un-sht", minStock: 100, isActive: true, createdAt: "2026-04-07T11:05:00Z" },
    { id: "p-cable", name: "Кабель NYM 3×2.5 мм²", sku: "CABLE-001", categoryId: "cat-2", unitId: "un-m", minStock: 30, isActive: true, createdAt: "2026-04-08T08:00:00Z" },
    { id: "p-glove", name: "Перчатки защитные латексные", sku: "GLOVE-001", categoryId: "cat-2", unitId: "un-up", minStock: 10, isActive: true, createdAt: "2026-04-08T08:15:00Z" },
  ],

  receipts: [
    {
      id: "rec-1001", documentNumber: "REC-1001", supplierId: "sup-1", warehouseId: "wh-1",
      date: "2026-05-08", status: "CONFIRMED", createdById: "u-store", createdAt: "2026-05-08T09:00:00Z",
      comment: "Плановая поставка инструментов и крепежа",
      items: [
        { id: "ri-1", productId: "p-drill", storageLocationId: "loc-a1", quantity: 5, unitPrice: 45000 },
        { id: "ri-2", productId: "p-perf", storageLocationId: "loc-a1", quantity: 3, unitPrice: 78000 },
        { id: "ri-3", productId: "p-bolt", storageLocationId: "loc-b1", quantity: 500, unitPrice: 35 },
      ],
    },
    {
      id: "rec-1002", documentNumber: "REC-1002", supplierId: "sup-3", warehouseId: "wh-1",
      date: "2026-05-10", status: "CONFIRMED", createdById: "u-store", createdAt: "2026-05-10T10:30:00Z",
      items: [
        { id: "ri-4", productId: "p-oil", storageLocationId: "loc-b2", quantity: 100, unitPrice: 650 },
        { id: "ri-5", productId: "p-cable", storageLocationId: "loc-b2", quantity: 200, unitPrice: 320 },
        { id: "ri-6", productId: "p-glove", storageLocationId: "loc-b1", quantity: 30, unitPrice: 1200 },
      ],
    },
    {
      id: "rec-1003", documentNumber: "REC-1003", supplierId: "sup-2", warehouseId: "wh-2",
      date: "2026-05-12", status: "CONFIRMED", createdById: "u-store", createdAt: "2026-05-12T08:00:00Z",
      items: [
        { id: "ri-7", productId: "p-tape", storageLocationId: "loc-x1", quantity: 50, unitPrice: 850 },
        { id: "ri-8", productId: "p-nut", storageLocationId: "loc-x1", quantity: 300, unitPrice: 25 },
      ],
    },
    {
      id: "rec-1004", documentNumber: "REC-1004", supplierId: "sup-1", warehouseId: "wh-1",
      date: "2026-05-17", status: "CONFIRMED", createdById: "u-store", createdAt: "2026-05-17T09:00:00Z",
      comment: "Пополнение крепежа",
      items: [
        { id: "ri-9", productId: "p-bolt", storageLocationId: "loc-b1", quantity: 200, unitPrice: 35 },
        { id: "ri-10", productId: "p-nut", storageLocationId: "loc-b1", quantity: 150, unitPrice: 25 },
      ],
    },
    {
      id: "rec-1005", documentNumber: "REC-1005", supplierId: "sup-3", warehouseId: "wh-1",
      date: "2026-05-18", status: "DRAFT", createdById: "u-store", createdAt: "2026-05-18T11:00:00Z",
      comment: "Плановая поставка — ожидает подтверждения",
      items: [
        { id: "ri-11", productId: "p-drill", storageLocationId: "loc-a2", quantity: 2, unitPrice: 44000 },
        { id: "ri-12", productId: "p-perf", storageLocationId: "loc-a2", quantity: 1, unitPrice: 77000 },
      ],
    },
  ],

  issues: [
    {
      id: "iss-1001", documentNumber: "ISS-1001", warehouseId: "wh-1",
      date: "2026-05-16", recipientName: "Строительный отдел", status: "CONFIRMED",
      createdById: "u-store", createdAt: "2026-05-16T14:00:00Z",
      items: [
        { id: "ii-1", productId: "p-drill", storageLocationId: "loc-a1", quantity: 2 },
        { id: "ii-2", productId: "p-bolt", storageLocationId: "loc-b1", quantity: 100 },
      ],
    },
    {
      id: "iss-1002", documentNumber: "ISS-1002", warehouseId: "wh-1",
      date: "2026-05-14", recipientName: 'ТОО "СтройКомплекс"', status: "CONFIRMED",
      createdById: "u-store", createdAt: "2026-05-14T10:00:00Z",
      items: [
        { id: "ii-3", productId: "p-oil", storageLocationId: "loc-b2", quantity: 20 },
        { id: "ii-4", productId: "p-glove", storageLocationId: "loc-b1", quantity: 5 },
      ],
    },
    {
      id: "iss-1003", documentNumber: "ISS-1003", warehouseId: "wh-1",
      date: "2026-05-18", recipientName: "Производственный цех № 3", status: "DRAFT",
      createdById: "u-store", createdAt: "2026-05-18T13:00:00Z",
      items: [
        { id: "ii-5", productId: "p-cable", storageLocationId: "loc-b2", quantity: 50 },
      ],
    },
  ],

  transfers: [
    {
      id: "trf-1001", documentNumber: "TRF-1001", fromWarehouseId: "wh-1", toWarehouseId: "wh-2",
      date: "2026-05-13", status: "CONFIRMED", createdById: "u-store", createdAt: "2026-05-13T15:00:00Z",
      comment: "Пополнение склада № 2",
      items: [
        { id: "ti-1", productId: "p-bolt", storageLocationId: "loc-b1", fromStorageLocationId: "loc-b1", toStorageLocationId: "loc-x1", quantity: 50 },
      ],
    },
    {
      id: "trf-1002", documentNumber: "TRF-1002", fromWarehouseId: "wh-1", toWarehouseId: "wh-2",
      date: "2026-05-18", status: "DRAFT", createdById: "u-store", createdAt: "2026-05-18T09:30:00Z",
      items: [
        { id: "ti-2", productId: "p-oil", storageLocationId: "loc-b2", fromStorageLocationId: "loc-b2", toStorageLocationId: "loc-x2", quantity: 30 },
      ],
    },
  ],

  // Movements derived from confirmed documents above
  movements: [
    // REC-1001 confirmed
    { id: "mv-1", productId: "p-drill", warehouseId: "wh-1", storageLocationId: "loc-a1", quantityChange: 5, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1001", createdById: "u-store", createdAt: "2026-05-08T09:10:00Z" },
    { id: "mv-2", productId: "p-perf", warehouseId: "wh-1", storageLocationId: "loc-a1", quantityChange: 3, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1001", createdById: "u-store", createdAt: "2026-05-08T09:10:00Z" },
    { id: "mv-3", productId: "p-bolt", warehouseId: "wh-1", storageLocationId: "loc-b1", quantityChange: 500, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1001", createdById: "u-store", createdAt: "2026-05-08T09:10:00Z" },
    // REC-1002 confirmed
    { id: "mv-4", productId: "p-oil", warehouseId: "wh-1", storageLocationId: "loc-b2", quantityChange: 100, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1002", createdById: "u-store", createdAt: "2026-05-10T10:40:00Z" },
    { id: "mv-5", productId: "p-cable", warehouseId: "wh-1", storageLocationId: "loc-b2", quantityChange: 200, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1002", createdById: "u-store", createdAt: "2026-05-10T10:40:00Z" },
    { id: "mv-6", productId: "p-glove", warehouseId: "wh-1", storageLocationId: "loc-b1", quantityChange: 30, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1002", createdById: "u-store", createdAt: "2026-05-10T10:40:00Z" },
    // REC-1003 confirmed
    { id: "mv-7", productId: "p-tape", warehouseId: "wh-2", storageLocationId: "loc-x1", quantityChange: 50, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1003", createdById: "u-store", createdAt: "2026-05-12T08:10:00Z" },
    { id: "mv-8", productId: "p-nut", warehouseId: "wh-2", storageLocationId: "loc-x1", quantityChange: 300, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1003", createdById: "u-store", createdAt: "2026-05-12T08:10:00Z" },
    // TRF-1001 confirmed
    { id: "mv-9", productId: "p-bolt", warehouseId: "wh-1", storageLocationId: "loc-b1", quantityChange: -50, movementType: "TRANSFER_OUT", sourceDocumentType: "TransferDocument", sourceDocumentId: "trf-1001", createdById: "u-store", createdAt: "2026-05-13T15:10:00Z" },
    { id: "mv-10", productId: "p-bolt", warehouseId: "wh-2", storageLocationId: "loc-x1", quantityChange: 50, movementType: "TRANSFER_IN", sourceDocumentType: "TransferDocument", sourceDocumentId: "trf-1001", createdById: "u-store", createdAt: "2026-05-13T15:10:00Z" },
    // ISS-1002 confirmed
    { id: "mv-11", productId: "p-oil", warehouseId: "wh-1", storageLocationId: "loc-b2", quantityChange: -20, movementType: "ISSUE", sourceDocumentType: "IssueDocument", sourceDocumentId: "iss-1002", createdById: "u-store", createdAt: "2026-05-14T10:10:00Z" },
    { id: "mv-12", productId: "p-glove", warehouseId: "wh-1", storageLocationId: "loc-b1", quantityChange: -5, movementType: "ISSUE", sourceDocumentType: "IssueDocument", sourceDocumentId: "iss-1002", createdById: "u-store", createdAt: "2026-05-14T10:10:00Z" },
    // ISS-1001 confirmed
    { id: "mv-13", productId: "p-drill", warehouseId: "wh-1", storageLocationId: "loc-a1", quantityChange: -2, movementType: "ISSUE", sourceDocumentType: "IssueDocument", sourceDocumentId: "iss-1001", createdById: "u-store", createdAt: "2026-05-16T14:10:00Z" },
    { id: "mv-14", productId: "p-bolt", warehouseId: "wh-1", storageLocationId: "loc-b1", quantityChange: -100, movementType: "ISSUE", sourceDocumentType: "IssueDocument", sourceDocumentId: "iss-1001", createdById: "u-store", createdAt: "2026-05-16T14:10:00Z" },
    // REC-1004 confirmed
    { id: "mv-15", productId: "p-bolt", warehouseId: "wh-1", storageLocationId: "loc-b1", quantityChange: 200, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1004", createdById: "u-store", createdAt: "2026-05-17T09:10:00Z" },
    { id: "mv-16", productId: "p-nut", warehouseId: "wh-1", storageLocationId: "loc-b1", quantityChange: 150, movementType: "RECEIPT", sourceDocumentType: "ReceiptDocument", sourceDocumentId: "rec-1004", createdById: "u-store", createdAt: "2026-05-17T09:10:00Z" },
  ],

  // Audit log
  auditLog: [
    { id: "al-1", userId: "u-admin", action: "CREATE", entityType: "Product", entityId: "p-drill", createdAt: "2026-04-05T10:00:00Z", details: "Дрель электрическая 750 Вт" },
    { id: "al-2", userId: "u-admin", action: "CREATE", entityType: "Product", entityId: "p-perf", createdAt: "2026-04-05T10:10:00Z", details: "Перфоратор Bosch 850 Вт" },
    { id: "al-3", userId: "u-admin", action: "CREATE", entityType: "Warehouse", entityId: "wh-1", createdAt: "2026-04-01T09:00:00Z", details: "Главный склад" },
    { id: "al-4", userId: "u-admin", action: "CREATE", entityType: "Warehouse", entityId: "wh-2", createdAt: "2026-04-01T09:05:00Z", details: "Склад № 2" },
    { id: "al-5", userId: "u-store", action: "CREATE", entityType: "ReceiptDocument", entityId: "rec-1001", createdAt: "2026-05-08T09:00:00Z", details: "REC-1001" },
    { id: "al-6", userId: "u-store", action: "CONFIRM", entityType: "ReceiptDocument", entityId: "rec-1001", createdAt: "2026-05-08T09:10:00Z", details: "REC-1001 → CONFIRMED" },
    { id: "al-7", userId: "u-store", action: "CREATE", entityType: "ReceiptDocument", entityId: "rec-1002", createdAt: "2026-05-10T10:30:00Z", details: "REC-1002" },
    { id: "al-8", userId: "u-store", action: "CONFIRM", entityType: "ReceiptDocument", entityId: "rec-1002", createdAt: "2026-05-10T10:40:00Z", details: "REC-1002 → CONFIRMED" },
    { id: "al-9", userId: "u-store", action: "CONFIRM", entityType: "TransferDocument", entityId: "trf-1001", createdAt: "2026-05-13T15:10:00Z", details: "TRF-1001 → CONFIRMED" },
    { id: "al-10", userId: "u-store", action: "CONFIRM", entityType: "IssueDocument", entityId: "iss-1002", createdAt: "2026-05-14T10:10:00Z", details: "ISS-1002 → CONFIRMED" },
    { id: "al-11", userId: "u-store", action: "CONFIRM", entityType: "IssueDocument", entityId: "iss-1001", createdAt: "2026-05-16T14:10:00Z", details: "ISS-1001 → CONFIRMED" },
    { id: "al-12", userId: "u-store", action: "CONFIRM", entityType: "ReceiptDocument", entityId: "rec-1004", createdAt: "2026-05-17T09:10:00Z", details: "REC-1004 → CONFIRMED" },
  ],
};
