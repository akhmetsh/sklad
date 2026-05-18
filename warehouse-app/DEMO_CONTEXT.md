# Demo Prototype — Context Overview

## What it is
A fully client-side warehouse management demo running at `/demo/*`. No backend, no login required. All state lives in React Context + `localStorage` (key `demo-state-v1`). Resetting via the sidebar button restores the initial dataset.

## Tech
Next.js 14 App Router · TypeScript · Tailwind CSS · `useReducer` + Context

## Initial dataset (`lib/demo/data.ts`)
- **3 users**: admin, storekeeper, manager
- **4 categories**: Инструменты, Расходные материалы, Запасные части, Упаковка
- **5 units**: шт, кг, л, м, уп
- **2 warehouses**: Главный склад (4 locations A-01–B-02), Склад №2 (2 locations X-01–X-02)
- **3 suppliers**: АлматыСнаб, ИП Сейткали, КазТехСнаб
- **8 products**: дрель, перфоратор, скотч, масло, болт М8, гайка М8, кабель NYM, перчатки
- **5 receipts**: 4 confirmed (REC-1001–1004), 1 draft (REC-1005)
- **3 issues**: 2 confirmed (ISS-1001–1002), 1 draft (ISS-1003)
- **2 transfers**: 1 confirmed (TRF-1001), 1 draft (TRF-1002)
- **16 pre-seeded stock movements** matching all confirmed documents
- **12 audit log entries**

## Pages

| URL | Description |
|-----|-------------|
| `/demo/dashboard` | Stats cards, recent movements, quick-action links |
| `/demo/products` | List with search + category filter |
| `/demo/products/new` | Create product form |
| `/demo/products/[id]` | Edit form + live stock per location |
| `/demo/categories` | List + inline create |
| `/demo/units` | List + inline create |
| `/demo/warehouses` | List + inline create, shows location count |
| `/demo/locations` | List + inline create with warehouse select |
| `/demo/suppliers` | List + inline create with contact fields |
| `/demo/documents/receipts` | List with status badges and totals |
| `/demo/documents/receipts/new` | Form: supplier, warehouse, date, dynamic item rows (product, location, qty, price) |
| `/demo/documents/receipts/[id]` | Detail view + **Confirm** button → creates RECEIPT movements |
| `/demo/documents/issues` | List with status badges |
| `/demo/documents/issues/new` | Form: warehouse, recipient, dynamic items with live available-stock hints |
| `/demo/documents/issues/[id]` | Detail view + **Confirm** button (blocks if stock insufficient) → creates ISSUE movements |
| `/demo/documents/transfers` | List with from/to warehouses |
| `/demo/documents/transfers/new` | Form: from/to warehouse + locations, items with live availability check |
| `/demo/documents/transfers/[id]` | Detail view + **Confirm** → creates TRANSFER_OUT + TRANSFER_IN movements atomically |
| `/demo/stock` | Filterable grid by warehouse / low-stock flag, red rows for critical |
| `/demo/reports/stock` | Summary table per product + per-warehouse breakdown |
| `/demo/users` | User list with role badges |
| `/demo/users/new` | Create user form (name, email, role) |
| `/demo/audit` | Chronological action log with entity type and details |

## State mutations (reducer actions)
`CREATE_PRODUCT` · `UPDATE_PRODUCT` · `CREATE_CATEGORY` · `CREATE_UNIT` · `CREATE_WAREHOUSE` · `CREATE_LOCATION` · `CREATE_SUPPLIER` · `CREATE_RECEIPT` · `CONFIRM_RECEIPT` · `CREATE_ISSUE` · `CONFIRM_ISSUE` · `CREATE_TRANSFER` · `CONFIRM_TRANSFER` · `CREATE_USER` · `NOTIFY` · `CLEAR_NOTIFY` · `RESET`

## Stock logic
Stock is never stored directly — it is computed on the fly from `movements[]` by `computeStock()` in `lib/demo/types.ts`. Confirming a document appends movements; cancellation is not implemented in the demo.

## Document workflow
`DRAFT → CONFIRMED`. Confirming an issue or transfer validates available stock inline in the reducer and returns an error notification instead of mutating if stock is insufficient.

## Layout
- **DemoSidebar** — grouped nav (Dashboard · Товары · Справочники · Документы · Склад · Отчёты · Администрирование) + DEMO badge + Reset button
- **DemoTopbar** — demo mode banner + toast notification (green/red, auto-dismiss 3.5 s)
- Both wrap all `/demo/*` pages via `app/demo/layout.tsx`
