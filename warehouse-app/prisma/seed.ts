import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Units
  const units = await Promise.all([
    db.unit.upsert({ where: { symbol: "шт" }, update: {}, create: { name: "Штука", symbol: "шт" } }),
    db.unit.upsert({ where: { symbol: "кг" }, update: {}, create: { name: "Килограмм", symbol: "кг" } }),
    db.unit.upsert({ where: { symbol: "л" }, update: {}, create: { name: "Литр", symbol: "л" } }),
    db.unit.upsert({ where: { symbol: "м" }, update: {}, create: { name: "Метр", symbol: "м" } }),
    db.unit.upsert({ where: { symbol: "уп" }, update: {}, create: { name: "Упаковка", symbol: "уп" } }),
  ]);

  // Categories
  const categories = await Promise.all([
    db.category.upsert({ where: { name: "Инструменты" }, update: {}, create: { name: "Инструменты" } }),
    db.category.upsert({ where: { name: "Расходные материалы" }, update: {}, create: { name: "Расходные материалы" } }),
    db.category.upsert({ where: { name: "Запасные части" }, update: {}, create: { name: "Запасные части" } }),
    db.category.upsert({ where: { name: "Упаковка" }, update: {}, create: { name: "Упаковка" } }),
  ]);

  // Warehouses
  const [wh1, wh2] = await Promise.all([
    db.warehouse.upsert({ where: { name: "Главный склад" }, update: {}, create: { name: "Главный склад", address: "ул. Складская, 1" } }),
    db.warehouse.upsert({ where: { name: "Склад №2" }, update: {}, create: { name: "Склад №2", address: "ул. Промышленная, 5" } }),
  ]);

  // Storage Locations
  const [loc1a, loc1b, loc2a] = await Promise.all([
    db.storageLocation.upsert({
      where: { warehouseId_code: { warehouseId: wh1.id, code: "A-01" } },
      update: {},
      create: { warehouseId: wh1.id, code: "A-01", name: "Стеллаж A, полка 1" },
    }),
    db.storageLocation.upsert({
      where: { warehouseId_code: { warehouseId: wh1.id, code: "B-01" } },
      update: {},
      create: { warehouseId: wh1.id, code: "B-01", name: "Стеллаж B, полка 1" },
    }),
    db.storageLocation.upsert({
      where: { warehouseId_code: { warehouseId: wh2.id, code: "X-01" } },
      update: {},
      create: { warehouseId: wh2.id, code: "X-01", name: "Зона X, ячейка 1" },
    }),
  ]);

  // Suppliers
  const supplier = await db.supplier.upsert({
    where: { id: "seed-supplier-1" },
    update: {},
    create: {
      id: "seed-supplier-1",
      name: 'ТОО "АлматыСнаб"',
      contactPerson: "Иванов А.П.",
      phone: "+7 727 123-45-67",
      email: "info@almatysnab.kz",
    },
  });

  // Products
  const [p1, p2, p3] = await Promise.all([
    db.product.upsert({
      where: { sku: "DRILL-001" },
      update: {},
      create: { name: "Дрель электрическая 750Вт", sku: "DRILL-001", categoryId: categories[0].id, unitId: units[0].id, minStock: 2 },
    }),
    db.product.upsert({
      where: { sku: "TAPE-001" },
      update: {},
      create: { name: "Скотч упаковочный 50мм", sku: "TAPE-001", categoryId: categories[3].id, unitId: units[4].id, minStock: 20 },
    }),
    db.product.upsert({
      where: { sku: "OIL-001" },
      update: {},
      create: { name: "Масло индустриальное И-20А", sku: "OIL-001", categoryId: categories[1].id, unitId: units[1].id, minStock: 50 },
    }),
  ]);

  // Users
  const adminHash = await hash("admin123", 12);
  const storekeepHash = await hash("store123", 12);
  const managerHash = await hash("manager123", 12);

  await Promise.all([
    db.user.upsert({
      where: { email: "admin@sklad.kz" },
      update: {},
      create: { name: "Администратор", email: "admin@sklad.kz", passwordHash: adminHash, role: "ADMIN" },
    }),
    db.user.upsert({
      where: { email: "storekeeper@sklad.kz" },
      update: {},
      create: { name: "Кладовщик Петров", email: "storekeeper@sklad.kz", passwordHash: storekeepHash, role: "STOREKEEPER" },
    }),
    db.user.upsert({
      where: { email: "manager@sklad.kz" },
      update: {},
      create: { name: "Менеджер Сидоров", email: "manager@sklad.kz", passwordHash: managerHash, role: "MANAGER" },
    }),
  ]);

  console.log("Seed complete.");
  console.log("Login credentials:");
  console.log("  admin@sklad.kz / admin123");
  console.log("  storekeeper@sklad.kz / store123");
  console.log("  manager@sklad.kz / manager123");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
