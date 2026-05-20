# Sklad — Warehouse Management System

A production-grade warehouse inventory management web application built as a graduation project.
Full Kazakh-language UI, fully responsive (mobile · tablet · desktop), with role-based access, atomic stock accounting, and audit trail.

---

## Жоба туралы

**Sklad** — қойма есебін жүргізуге арналған веб-қосымша. Жүйе тауарлы-материалдық құндылықтарды бірнеше қойма мен сақтау орындары бойынша есепке алуға, кіріс/шығыс/аударым құжаттарын ресімдеуге және қалдықтар мен қозғалыстар бойынша есеп жасауға мүмкіндік береді.

**Негізгі мүмкіндіктер:**
- 3 рөл: Әкімші, Қоймашы, Менеджер — әрқайсысының өз қол жеткізу деңгейі
- Атомдық операциялармен жұмыс істейтін қойма есебі (қалдық арнайы бағанда сақталмайды, барлық қозғалыс журналынан есептеледі)
- Кіріс, Шығыс, Аударым құжаттарының толық циклі (Жоба → Расталған → Болдырылмаған)
- Барлық әрекеттердің журналы (audit log)
- Штрихкод генерациясы (Code-128) және сканері
- Тауар суреттерін жүктеу
- CSV экспорт, басып шығаруға дайын құжаттар
- Толық бейімделген интерфейс (телефон, планшет, дербес компьютер)
- Қазақ тілінде интерфейс

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS, Lucide icons, custom design primitives |
| Auth | Auth.js v5 (next-auth) with JWT sessions, edge-safe split config |
| Database | PostgreSQL 15+ |
| ORM | Prisma 5 |
| Validation | Zod (shared client + server schemas) |
| Forms | react-hook-form + @hookform/resolvers/zod |
| Barcode | bwip-js (server-rendered SVG) + @zxing/browser (camera scanning) |
| Localization | Custom dictionary (`lib/i18n/kk.ts`), Inter font with `cyrillic-ext` subset |

---

## Quick start

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (e.g. Postgres.app on macOS, or `brew install postgresql`)

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd warehouse-app

# 2. Install dependencies
npm install

# 3. Create the database
createdb warehouse_db

# 4. Copy and edit environment variables
cp .env.example .env
# Set DATABASE_URL and AUTH_SECRET (generate with: openssl rand -base64 32)

# 5. Run migrations and seed
npx prisma migrate deploy
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

### Seed credentials

| Role | Email | Password |
|---|---|---|
| Әкімші (Admin) | `admin@sklad.kz` | `admin123` |
| Қоймашы (Storekeeper) | `storekeeper@sklad.kz` | `store123` |
| Менеджер (Manager) | `manager@sklad.kz` | `manager123` |

---

## Architecture decisions

### Movement-based stock accounting

Stock is **never stored as a single column on the product**. Instead, every change to inventory creates a `StockMovement` record (`+N` for receipts, `−N` for issues, paired `±N` for transfers). The current balance at any location is computed as:

```
balance(product, warehouse, location) = SUM(quantityChange)
  WHERE productId=? AND warehouseId=? AND storageLocationId=?
```

**Why this matters:**
- Audit-proof: every change is attributable to a document and a user
- No drift: there's no separate counter that can get out of sync with the history
- Reversible: cancelling a confirmed document just writes an opposing `INVENTORY_ADJUSTMENT` movement
- Point-in-time queries: filter movements by date to reconstruct historical balances

The cost is a single aggregation query per balance read, mitigated by indexes on `(productId, warehouseId)` and `(sourceDocumentId, sourceDocumentType)`.

### Atomic document confirmation

Confirming any document runs inside `prisma.$transaction`:

1. Validate stock availability (for issues/transfers — receipts always pass)
2. Update document status to `CONFIRMED`
3. Insert `StockMovement` rows in bulk

If any step fails, the entire transaction rolls back. The DB is the source of truth — there's no in-memory state that can drift.

Transfers create **two** movements (`TRANSFER_OUT` on source, `TRANSFER_IN` on destination) within the same transaction.

### Edge-safe auth config

Next.js middleware runs on the Edge runtime, which doesn't support Node-only modules like `bcryptjs` or `@prisma/client`. The auth config is therefore split:

- `auth.config.ts` — edge-safe (no heavy imports), used by middleware
- `auth.ts` — full config with bcryptjs + PrismaAdapter, used by API routes

### Server Components by default

Pages fetch data directly via Prisma on the server and pass plain JSON to small `*Client.tsx` components only where interactivity is needed (forms, filters, modals). This keeps the JS bundle small — important for mobile users in a warehouse on spotty connections.

---

## Permissions matrix

| Section | ADMIN | STOREKEEPER | MANAGER |
|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ |
| Products — view | ✓ | ✓ | ✓ |
| Products — edit / soft-delete | ✓ | ✓ | — |
| Reference data — edit | ✓ | ✓ | — |
| Documents — view | ✓ | ✓ | ✓ |
| Documents — create / confirm / cancel | ✓ | ✓ | — |
| Stock — view | ✓ | ✓ | ✓ |
| Reports + CSV | ✓ | ✓ | ✓ |
| Users management | ✓ | — | — |
| Audit log | ✓ | — | ✓ |

Enforced at two layers: UI hides controls users can't use, and every API route re-checks with `requirePermission(...)`.

---

## Project structure

```
warehouse-app/
├── app/
│   ├── (protected)/          ← all auth-gated routes, share Sidebar/Topbar layout
│   │   ├── dashboard/
│   │   ├── products/{[id], [id]/movements, new}
│   │   ├── categories/  units/  warehouses/  locations/  suppliers/
│   │   ├── documents/{receipts, issues, transfers}/{[id], new}
│   │   ├── stock/
│   │   ├── reports/stock/
│   │   ├── users/
│   │   └── audit/
│   ├── api/                  ← REST-style Route Handlers
│   │   ├── auth/[...nextauth]/
│   │   ├── search/           ← Cmd+K global search
│   │   ├── upload/product-image/
│   │   ├── {entity}/         ← GET, POST
│   │   ├── {entity}/[id]/    ← PATCH, DELETE
│   │   └── documents/{type}/[id]/{confirm,cancel}/
│   ├── login/
│   ├── error.tsx             ← Kazakh error boundary
│   ├── not-found.tsx         ← Kazakh 404
│   └── layout.tsx            ← root layout with Inter font, ToastProvider
│
├── components/
│   ├── layout/               ← Sidebar (mobile drawer), Topbar (hamburger + Cmd+K), PageHeader, CommandPalette
│   ├── ui/                   ← Button, Input, Select, FormField, Sheet, ConfirmDialog, Toast, DataTable, Badge variants, EmptyState, Skeleton, Barcode, ImagePicker
│   ├── forms/                ← LoginForm, ProductForm, UserCreateForm
│   └── documents/            ← ReceiptDocumentForm, IssueDocumentForm, TransferDocumentForm, ConfirmDocumentButton, CancelDocumentButton, PrintButton
│
├── lib/
│   ├── i18n/{kk.ts, index.ts}    ← Kazakh dictionary
│   ├── db/                       ← Prisma client singleton
│   ├── auth/session.ts           ← getSession(), requireRole()
│   ├── api/helpers.ts            ← requireSession, requirePermission, badRequest, notFound
│   ├── permissions/              ← role × permission matrix + can()
│   ├── audit/                    ← logAudit()
│   ├── validators/               ← Zod schemas (auth, product, reference, document, user)
│   ├── services/                 ← receipt, issue, transfer, stock, document-number, errors
│   ├── hooks/useMediaQuery.ts
│   ├── format.ts                 ← kk-KZ date/number/money/quantity formatters
│   ├── csv.ts                    ← toCSV + downloadCSV
│   └── cn.ts                     ← clsx + tailwind-merge
│
├── prisma/
│   ├── schema.prisma             ← all entity definitions
│   ├── seed.ts                   ← realistic test data
│   └── migrations/
│
└── public/uploads/products/      ← user-uploaded product images
```

---

## Key features

### Document workflow
- Three document types: Receipt (`Кіріс`), Issue (`Шығыс`), Transfer (`Аударым`)
- Document numbers are auto-generated as `REC-2026-00001` (year + 5-digit serial)
- Status transitions: `DRAFT` → `CONFIRMED` → `CANCELLED`
- Confirming creates `StockMovement` rows atomically
- Cancelling a confirmed document writes opposing `INVENTORY_ADJUSTMENT` movements; blocked if subsequent consumption would push the source location into negative stock
- Each document item has product, storage location, quantity; receipts also have optional unit price for cost tracking
- Live availability hints on issue/transfer forms (red text when requested > available)

### Reports & exports
- **Dashboard:** stat cards (products, warehouses, locations, low-stock, draft documents), recent movements feed, top-5 low-stock products, quick-action buttons (visible to STOREKEEPER+)
- **Stock balance** (`/stock`): full grid filterable by warehouse, category, search term, low-stock toggle; alert banner counts critical items
- **Stock report** (`/reports/stock`): 4 stat cards + per-product summary table + per-warehouse breakdown + CSV export
- **Movement history per product** (`/products/[id]/movements`): every movement with source-document deep links
- **CSV export** on all 4 list pages (receipts, issues, transfers, audit) — respects current filter set, UTF-8 BOM + `;` separator (Excel-friendly in CIS locales)
- **Print** on every document detail page (`window.print()` + dedicated `@media print` CSS that hides chrome)

### Productivity
- **Cmd+K / Ctrl+K** global command palette: search across products (name/SKU/barcode), all document types, users; offers quick actions when empty
- **Barcode generation** (Code-128) on product detail page
- **Barcode scanning** via device camera on document forms (look up product by barcode)
- **Image upload** per product, 4 MB limit, JPEG/PNG/WEBP
- **Soft delete** for reference data; block delete when entity is referenced
- **Date range filters** on document lists

### Reliability
- Toasts on every mutation (success + error)
- Loading skeletons during navigation
- Empty states with calls-to-action
- Kazakh error boundary and 404 page
- Form-level Zod validation with Kazakh error messages
- Server-side re-validation on every API route

---

## Available scripts

```bash
npm run dev          # Start dev server (auto-reload)
npm run build        # Production build
npm run start        # Run production build
npm run lint         # Next.js linter

npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Create + apply a new migration
npm run db:push      # Push schema without migration (dev only)
npm run db:seed      # Reset and seed test data
npm run db:studio    # Open Prisma Studio (visual DB editor)
```

---

## Implementation phases

The project was built in phases — see [`IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md) for the detailed breakdown:

- **Phase 0** — i18n + responsive layout primitives + UI design system
- **Phase 1** — MVP: auth, reference data, products, documents, stock, reports, users, audit, dashboard
- **Phase 2** — operational polish: movement history, cancel docs, print, CSV, date filters, image upload, barcode generation, Cmd+K search
- **Phase 3** — advanced (barcode scanning, write-offs, inventory sessions — partial)
- **Phase 4** — production hardening (tests, CI, deployment)

---

## License

Built as an academic project. All rights reserved by the author.
