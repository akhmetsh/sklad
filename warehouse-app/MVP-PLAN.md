# MVP Plan — Складская система учета

## Стек технологий
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — стили
- **Auth.js v5** (next-auth) — аутентификация, JWT-сессии
- **Prisma ORM** + **PostgreSQL** — база данных
- **Zod** — валидация на сервере и клиенте
- **react-hook-form** + **@hookform/resolvers/zod** — формы

---

## Этапы реализации MVP

### Этап 1 — Инфраструктура (готово ✓)
- [x] Next.js проект с TypeScript
- [x] Tailwind CSS
- [x] Prisma схема (`prisma/schema.prisma`)
- [x] Auth.js конфигурация (`auth.ts`, `middleware.ts`)
- [x] Переменные окружения (`.env.example`)

### Этап 2 — База данных (следующий шаг)
```bash
# 1. Скопируйте .env.example в .env и укажите DATABASE_URL
cp .env.example .env

# 2. Создайте базу данных PostgreSQL
createdb warehouse_db

# 3. Примените миграции
npx prisma migrate dev --name init

# 4. Заполните тестовыми данными
npm run db:seed
```

**Тестовые пользователи после seed:**
| Email | Пароль | Роль |
|---|---|---|
| admin@sklad.kz | admin123 | Администратор |
| storekeeper@sklad.kz | store123 | Кладовщик |
| manager@sklad.kz | manager123 | Менеджер |

### Этап 3 — Установка и запуск
```bash
npm install
npm run dev
# Открыть http://localhost:3000
```

---

## Архитектура проекта

```
warehouse-app/
├── app/
│   ├── (protected)/         ← Shared layout с Sidebar+Topbar
│   │   └── layout.tsx
│   ├── login/               ← Публичная страница входа
│   ├── dashboard/           ← Дашборд с сводкой
│   ├── products/            ← CRUD товаров
│   │   ├── new/
│   │   └── [id]/
│   ├── warehouses/          ← Справочник складов
│   ├── locations/           ← Места хранения
│   ├── suppliers/           ← Поставщики
│   ├── documents/
│   │   ├── receipts/        ← Поступления
│   │   ├── issues/          ← Выдачи
│   │   └── transfers/       ← Перемещения
│   ├── stock/               ← Текущие остатки
│   ├── reports/stock/       ← Отчет по остаткам
│   ├── users/               ← Управление пользователями (ADMIN)
│   ├── audit/               ← Журнал действий (ADMIN/MANAGER)
│   └── api/                 ← Route Handlers
│       ├── auth/[...nextauth]/
│       ├── products/
│       └── documents/{receipts,issues,transfers}/
│
├── components/
│   ├── layout/              ← Sidebar, Topbar, PageHeader
│   ├── forms/               ← LoginForm, ProductForm
│   ├── documents/           ← ReceiptDocumentForm, ConfirmDocumentButton
│   └── ui/                  ← StatusBadge (и другие примитивы)
│
├── lib/
│   ├── db/                  ← Prisma singleton
│   ├── auth/session.ts      ← getSession(), requireRole()
│   ├── permissions/         ← can(role, permission)
│   ├── audit/               ← logAudit()
│   ├── validators/          ← Zod-схемы (auth, product, document)
│   └── services/            ← Бизнес-логика
│       ├── stock.service.ts     ← Остатки, история движений
│       ├── receipt.service.ts   ← Создание и подтверждение поступлений
│       ├── issue.service.ts     ← Создание и подтверждение выдач
│       └── transfer.service.ts  ← Создание и подтверждение перемещений
│
├── prisma/
│   ├── schema.prisma        ← Все модели данных
│   └── seed.ts              ← Тестовые данные
│
└── types/
    └── next-auth.d.ts       ← Расширение типов сессии
```

---

## Ключевые бизнес-правила (уже реализованы в services/)

| Правило | Где реализовано |
|---|---|
| Остатки меняются только через подтверждение документа | `*.service.ts` → confirm* |
| Выдача проверяет доступный остаток | `issue.service.ts` → checkSufficientStock |
| Перемещение — атомарная транзакция TRANSFER_OUT + TRANSFER_IN | `transfer.service.ts` → $transaction |
| Каждая операция привязана к пользователю | `createdById` во всех документах |
| Критические действия записываются в AuditLog | `logAudit()` в каждом service |
| Роли ограничивают доступ | `middleware.ts` + `requireRole()` + `can()` |

---

## Что нужно дописать для завершения MVP

### Обязательно (высокий приоритет)
- [ ] Перенести страницы в `app/(protected)/` чтобы применялся Sidebar+Topbar layout
- [ ] Страницы `/documents/issues/new` и `/documents/transfers/new` (формы по аналогии с ReceiptDocumentForm)
- [ ] Страницы `/documents/issues/[id]` и `/documents/transfers/[id]` (детальный вид)
- [ ] CRUD для справочников: Категории, Единицы, Места хранения, Поставщики (формы + API)
- [ ] CRUD для Складов (форма + API)
- [ ] Создание пользователей через UI (страница `/users/new`)

### Средний приоритет
- [ ] Поиск/фильтр в таблицах товаров и документов
- [ ] Пагинация в длинных списках
- [ ] Экспорт отчета остатков в CSV

### После MVP
- [ ] Списание товара (WriteOffDocument)
- [ ] Инвентаризация (InventorySession)
- [ ] Отчет по движениям за период
- [ ] Дефицитные позиции на дашборде

---

## Структура БД (сущности)

```
User ─────────────┐
                  │ createdById
Category ─┐       │
Unit ──────┤       │
           ├── Product ──── ReceiptItem ──── ReceiptDocument ──── Supplier
Warehouse ─┤              │ IssueItem   ──── IssueDocument
           │              │ TransferItem ─── TransferDocument
StorageLocation ──┘
                    StockMovement (RECEIPT | ISSUE | TRANSFER_OUT | TRANSFER_IN | WRITE_OFF | INVENTORY_ADJUSTMENT)
                    AuditLog
```

---

## Принцип учета остатков

```
Остаток(товар, склад, место) = SUM(StockMovement.quantityChange)
  WHERE productId = X AND warehouseId = Y AND storageLocationId = Z

Поступление   → quantityChange = +N
Выдача        → quantityChange = −N
Перемещение   → TRANSFER_OUT: −N на исходном + TRANSFER_IN: +N на целевом
```

Нет отдельного поля "остаток" — только история движений.

---

## Ролевая модель

| Раздел | ADMIN | STOREKEEPER | MANAGER |
|---|---|---|---|
| Дашборд | ✓ | ✓ | ✓ |
| Товары (просмотр) | ✓ | ✓ | ✓ |
| Товары (редакт.) | ✓ | ✓ | — |
| Справочники | ✓ | ✓ | — |
| Документы | ✓ | ✓ | только просмотр |
| Подтверждение документов | ✓ | ✓ | — |
| Остатки / Отчеты | ✓ | ✓ | ✓ |
| Пользователи | ✓ | — | — |
| Журнал аудита | ✓ | — | ✓ |
