# Sklad — Implementation Plan v2

Warehouse management system for the diploma project.
**UI language: Kazakh (қазақша).** Fully responsive (mobile, tablet, desktop).

---

## 1. Project goals

Build a production-grade warehouse management web application that:
- Tracks goods across multiple warehouses and storage locations
- Manages document workflow (receipts, issues, transfers) with strict accounting
- Enforces role-based access (Administrator / Storekeeper / Manager)
- Maintains an immutable audit trail
- Works equally well on a desk monitor and a phone in the warehouse aisle
- Is fully localized in Kazakh

---

## 2. Current state audit

What's already in the repo:

### Infrastructure
- [x] Next.js 14 (App Router) + TypeScript + Tailwind CSS
- [x] Prisma + PostgreSQL schema (all entities defined)
- [x] Auth.js v5 with split edge-safe config (`auth.config.ts` + `auth.ts`)
- [x] Middleware route protection
- [x] Seed script with 3 test users

### Data layer
- [x] Prisma schema: User, Category, Unit, Supplier, Warehouse, StorageLocation, Product, ReceiptDocument, IssueDocument, TransferDocument, StockMovement, AuditLog
- [x] Movement-based stock accounting (no balance field — computed from `StockMovement`)
- [x] Initial migration applied

### Services (business logic in `lib/services/`)
- [x] `stock.service.ts` — `getStockBalance`, `checkSufficientStock`, `getStockSummary`, `getMovementHistory`
- [x] `receipt.service.ts` — create + confirm receipts (creates RECEIPT movements)
- [x] `issue.service.ts` — create + confirm issues with stock validation
- [x] `transfer.service.ts` — atomic TRANSFER_OUT + TRANSFER_IN in single transaction

### API routes (`app/api/`)
- [x] `/api/auth/[...nextauth]`
- [x] Products: GET, POST, PATCH
- [x] Categories: GET, POST, PATCH
- [x] Units, Warehouses, Locations, Suppliers, Users: POST
- [x] All three document types: POST + `/[id]/confirm`

### UI (`app/(protected)/`)
- [x] Pages exist for all MVP routes (dashboard, products, references, documents, stock, reports, users, audit)
- [x] Sidebar, Topbar, PageHeader components
- [x] LoginForm, ProductForm, document forms, ConfirmDocumentButton
- [x] StatusBadge, InlineCreateForm

### Validation
- [x] Zod schemas for auth, product, all three document types

### What's known to be incomplete
- UI text is in Russian — needs full conversion to Kazakh
- Layout is desktop-only (fixed 224 px sidebar, no mobile menu, tables overflow on small screens)
- Forms lack proper loading/error states and toasts
- No client-side search/filter/pagination on lists
- Reports are minimal
- No write-off or inventory features yet

---

## 3. New critical requirements

### 3.1 Kazakh localization

**Approach**: Single source-of-truth dictionary, server-rendered. No runtime i18n library needed for one language.

```
lib/i18n/kk.ts   — every UI string keyed by topic
lib/i18n/index.ts — export `t(key)` helper
```

Conventions:
- All user-facing text comes through `t("products.title")` style keys
- Validation messages from Zod use Kazakh by default
- Date/number formats: `ru-KZ` locale, Almaty timezone (`Asia/Almaty`)
- Currency: `KZT` (₸)
- Document number format: prefix in Latin (REC-1001, ISS-1001, TRF-1001) for sortability

**Translation rules** (verify each with a native speaker before shipping):

| Russian (current) | Kazakh (target) |
|---|---|
| Склад | Қойма |
| Товары | Тауарлар |
| Категория | Санат |
| Единица измерения | Өлшем бірлігі |
| Поставщик | Жеткізуші |
| Место хранения | Сақтау орны |
| Поступление | Кіріс |
| Выдача | Шығыс |
| Перемещение | Аударым |
| Остаток | Қалдық |
| Документ | Құжат |
| Черновик | Жоба |
| Проведён | Расталған |
| Подтвердить | Растау |
| Создать | Жасау |
| Сохранить | Сақтау |
| Отмена | Болдырмау |
| Пользователь | Пайдаланушы |
| Журнал | Журнал |
| Дашборд | Басты бет |
| Отчёт | Есеп |
| Администратор | Әкімші |
| Кладовщик | Қойма меңгерушісі |
| Менеджер | Менеджер |

These need verification — placeholder until reviewed.

### 3.2 Responsive design

**Strategy**: mobile-first Tailwind, breakpoints `sm 640 / md 768 / lg 1024 / xl 1280`.

| Pattern | Mobile (< md) | Desktop (≥ md) |
|---|---|---|
| Sidebar | Off-canvas drawer (hamburger in topbar) | Fixed left column |
| Tables | Stacked cards (or horizontal scroll for dense data) | Standard table |
| Forms | Single column, full-width inputs | Multi-column grid |
| Page padding | 12–16 px | 24–32 px |
| Tap targets | ≥ 44×44 px | normal |
| Document item rows | Each row becomes a card with all fields stacked | Inline row |
| Modals | Full-screen sheet | Centered modal |
| Filters | Bottom-sheet drawer | Inline above table |

Specific components to build/rebuild:
- `<ResponsiveSidebar />` with mobile drawer state
- `<Topbar />` with hamburger trigger
- `<DataTable />` that swaps between table and card view via `useMediaQuery`
- `<FormField />` primitive with consistent sm/md layouts
- `<Sheet />` / `<Modal />` that adapt to viewport
- `<Toast />` notification component

---

## 4. Reusable lessons from the demo

The demo (now removed) proved out:
- The data shape matches the Prisma schema 1:1 — schema is solid
- Stock validation in the confirm step (inline, with clear error messaging) is the right UX
- Inline create forms for reference data (Категории/Единицы/Поставщики) are faster than modals
- Item-row pattern for document forms (add/remove rows, live availability check) works well
- Status badges with clear color coding (yellow=draft, green=confirmed) read fast

These patterns will be ported to the real authenticated pages with proper API calls.

---

## 5. Implementation phases

### Phase 0 — Foundation ✓ DONE

- [x] `lib/i18n/kk.ts` — comprehensive Kazakh dictionary; `lib/i18n/index.ts` exports `t`
- [x] `lib/cn.ts` — clsx + tailwind-merge utility
- [x] `lib/format.ts` — `kk-KZ` date/datetime/number/money/quantity formatters, Almaty timezone
- [x] `lib/hooks/useMediaQuery.ts` — responsive hooks (`useIsMobile`, `useIsDesktop`)
- [x] Tailwind theme: brand color scale, custom animations (slide-in, fade-in), sidebar colors
- [x] Inter font via `next/font/google` with `cyrillic-ext` subset, exposed as `--font-inter` CSS variable
- [x] Global CSS: touch-friendly 44 px tap targets, 16 px form fonts (anti-zoom on iOS), custom scrollbar
- [x] Root layout: `lang="kk"`, viewport meta with `maximumScale: 5`, ToastProvider wrapper
- [x] UI primitives in `components/ui/`:
      `Button`, `Input`/`Textarea`/`Select`, `FormField`, `Toast` + `useToast()`,
      `Sheet` (right/left/bottom variants), `Badge` + `DocumentStatusBadge`/`RoleBadge`/`StockStatusBadge`/`MovementBadge`,
      `EmptyState`, `Skeleton`/`SkeletonRow`/`SkeletonCard`, `DataTable` (swaps to card view on `< md`)
- [x] Responsive `Sidebar` with sections + icons, off-canvas drawer on mobile
- [x] Responsive `Topbar` with hamburger button + user dropdown
- [x] `LayoutShell` client wrapper owns drawer state; `(protected)/layout.tsx` is a thin server wrapper
- [x] **Vertical slice**: `/login` and `/dashboard` fully migrated to Kazakh + responsive
- [x] Zero TypeScript errors; `next build` succeeds; dev server renders Kazakh correctly

Deliverable met: foundation is in place. Old pages still use Russian text but the infrastructure to convert them is ready.

---

### Phase 1 — MVP completion (3–5 days)

Goal: every MVP route works end-to-end with real DB, role enforcement, validation, toasts, and responsive UI.

#### 1.1 Authentication
- [ ] Polished login page with branded layout, responsive form
- [ ] Error messages in Kazakh
- [ ] "Logged in as" indicator in topbar, sign-out button

#### 1.2 Reference data (CRUD with edit + soft-delete) ✓ DONE
Routes: `/categories`, `/units`, `/warehouses`, `/locations`, `/suppliers`

For each:
- [x] List page with search + responsive table/card view (DataTable swaps to cards on `< md`)
- [x] Create/edit via right-side Sheet drawer (same UX on all viewports)
- [x] Soft-delete via `ConfirmDialog` (sets `isActive = false`)
- [x] Server-side block on delete if entity is referenced (Kazakh error returned to toast)
- [x] Optimistic local state update + `router.refresh()` for cache, toast feedback on success/error

Added in this slice:
- `lib/validators/reference.ts` — centralized Zod schemas with Kazakh `t.validation.*` messages
- `lib/api/helpers.ts` — `requireSession`, `requirePermission`, `badRequest`, `notFound` helpers; removes ~10 lines of boilerplate per route
- API routes completed for all 5 entities: `GET`, `POST` at `/api/{entity}`, `PATCH`/`DELETE` at `/api/{entity}/[id]`
- `components/ui/ConfirmDialog.tsx` — destructive/normal modes, ESC-to-close, body scroll lock
- 5 client pages (`*Client.tsx`): Categories, Units, Warehouses, Locations (with warehouse filter + select), Suppliers (multi-field form)
- Legacy `InlineCreateForm` and `LocationCreateForm` removed

#### 1.3 Products ✓ DONE
- [x] List with search, category filter, low-stock toggle (responsive table/cards)
- [x] Create form with category/unit selects (`/products/new`)
- [x] Edit form with live total-stock display per warehouse+location (`/products/[id]`)
- [x] Optional barcode field
- [x] Soft-delete from list view with `ConfirmDialog`
- [ ] Server-side pagination (deferred to Phase 2)

Added in this slice:
- `lib/validators/product.ts` rewritten with Kazakh `t.validation.*` messages
- `lib/services/stock.service.ts` — added `getStockTotalsByProduct(ids)` and `getProductStockBreakdown(id)`
- `app/api/products/route.ts` + `[id]/route.ts` use new helpers; PATCH/DELETE added; unique SKU error returns Kazakh message
- `components/forms/ProductForm.tsx` rebuilt with new UI primitives, react-hook-form + zod, responsive single→two-column layout, `useToast` feedback
- `ProductsClient` (list) with three filters (search, category, low-stock checkbox), stock total column with color coding, soft-delete

#### 1.4 Document workflow — Receipts ✓ DONE
- [x] Kazakh validators with field-level messages
- [x] List page (`/documents/receipts`): search by number/supplier/warehouse, status filter, responsive DataTable
- [x] New form (`/documents/receipts/new`): dynamic item rows via `useFieldArray`, mobile-friendly stacked layout, live total cost calculation
- [x] Detail page (`/documents/receipts/[id]`): full requisites, item table (desktop) / cards (mobile), Confirm button when DRAFT
- [x] Confirm flow uses new `ConfirmDocumentButton` (with ConfirmDialog + Toast); on success creates RECEIPT stock movements + audit entry

Added in this slice:
- `lib/services/document-number.ts` — generates `REC-YYYY-NNNNN` (and ISS/TRF) numbers from yearly counter
- `lib/services/errors.ts` — shared `DocumentError` class (status + Kazakh message)
- `lib/services/receipt.service.ts` — refactored to throw `DocumentError` with Kazakh messages
- `app/api/documents/receipts/route.ts` + `.../[id]/confirm/route.ts` — use shared helpers
- `components/documents/ConfirmDocumentButton.tsx` — rebuilt with ConfirmDialog + toast
- `components/documents/ReceiptDocumentForm.tsx` — responsive item rows (12-col grid → stacked on mobile), live total, locations auto-filter by selected warehouse

#### 1.4b Document workflow — Issues + Transfers ✓ DONE

**Issues** (`/documents/issues`)
- [x] List with search + status filter, responsive
- [x] Create form: warehouse + recipient + date + dynamic item rows with **live stock availability hints** per row (red text when insufficient)
- [x] Detail page: shows availability column for DRAFT docs, confirm button only enabled when all rows have sufficient stock; banner explains low-stock situation
- [x] Confirm flow: server re-validates stock per row, throws Kazakh `DocumentError` with product name + numbers if insufficient; otherwise creates ISSUE movements

**Transfers** (`/documents/transfers`)
- [x] List with from→to warehouse pair, search + status filter, responsive
- [x] Create form: from/to warehouse selects (cross-validation prevents same), source/dest locations filter by chosen warehouse, live stock check on source side
- [x] Detail page: source/dest in requisites grid, item rows show both locations with arrow icon, mobile cards show route compactly, availability check identical to issues
- [x] Confirm flow: atomic transaction creates TRANSFER_OUT + TRANSFER_IN movements; Zod refine + service layer both enforce "different warehouses"

Added in this slice:
- `lib/services/issue.service.ts` + `transfer.service.ts` — refactored to throw `DocumentError` with quantitative Kazakh messages ("«Дрель» — қалдық жеткіліксіз (қажет: 5, бар: 2)")
- All 4 affected API routes now use `requirePermission` helper, return Kazakh errors via `badRequest`
- `IssueDocumentForm` + `TransferDocumentForm` — fully responsive (12-col grid → stacked cards on mobile), live availability hints computed client-side from preloaded stock snapshot
- Detail pages show per-row availability for DRAFT and hide the confirm button when stock is insufficient (avoids the round-trip 409)

#### 1.5 Stock balance ✓ DONE
- [x] `/stock`: full balance grid with warehouse + category filter, search, low-stock toggle
- [x] Color-coded rows (red bg if below minStock) + alert banner with count
- [x] Responsive table/cards
- [ ] Click into product → movement history (Phase 2)

#### 1.6 Reports ✓ DONE
- [x] `/reports/stock`: 4 stat cards (products / locations / low-stock / out-of-stock)
- [x] Per-product summary (category, total qty, locations count, status)
- [x] Per-warehouse breakdown
- [x] CSV export — UTF-8 BOM + `;` separator (Excel-friendly in CIS locales)
- [ ] Date snapshot (Phase 2)

#### 1.7 Users management (ADMIN only) ✓ DONE
- [x] List with role badges, active/inactive status, creation date, responsive
- [x] Create user form: react-hook-form + Zod with Kazakh messages, role select, password min 6
- [x] Email uniqueness check returns friendly Kazakh error from server
- [ ] Edit role / deactivate / reset password (Phase 2)

#### 1.8 Audit log ✓ DONE
- [x] `/audit`: last 500 entries, filters: user search, action, entity type
- [x] Kazakh labels for actions (Жасау/Өзгерту/Растау/Жою/Болдырмау) and entity types
- [x] Color-coded action badges; responsive

Added in this slice:
- `lib/csv.ts` — `toCSV` + `downloadCSV` with UTF-8 BOM
- `lib/validators/user.ts` — Kazakh validators for user creation
- `/api/users/route.ts` migrated to `requirePermission` helper

#### 1.9 Dashboard ✓ DONE (built during Phase 0 vertical slice, polished now)
- [x] 5 stat cards (products, warehouses, locations, low-stock, draft documents) — responsive 2/3/5-col grid
- [x] Quick-action buttons (new receipt/issue/transfer) — visible only when `createDocuments` permission
- [x] Recent 5 movements list with `MovementBadge` + signed quantity
- [x] Top 5 low-stock products ranked by `quantity/minStock` ratio

#### 1.10 Cross-cutting ✓ DONE
- [x] Toasts on every mutation (success + error) via `ToastProvider` + `useToast`
- [x] Loading skeletons — added `ListSkeleton`, `DetailSkeleton`, `FormSkeleton` and `loading.tsx` files for the protected route group + product/document detail/new
- [x] Empty states with optional call-to-action button (`EmptyState` primitive, used by all list pages)
- [x] **404 page** in Kazakh (`app/not-found.tsx`) — branded panel with "back to dashboard" link
- [x] **Error boundary** (`app/error.tsx`) — Kazakh, shows error digest ID, retry button

Deliverable: a usable warehouse system that a real storekeeper could operate from a phone.

---

### Phase 2 — Important enhancements (2–4 days)

#### 2.1 Operational polish ✓ DONE
- [x] **Movement history per product** — `/products/[id]/movements` lists every StockMovement with source-doc deep links, responsive table/cards
- [x] **Cancel document action** — DRAFT → CANCELLED (status only); CONFIRMED → CANCELLED with reverse `INVENTORY_ADJUSTMENT` movements inside a transaction. Receipts/transfers check destination stock before reversing; if subsequent consumption depleted it, the cancel is blocked with a Kazakh error. Cancel routes added for all 3 doc types.
- [x] **Print-friendly views** — `window.print()` + `@media print` CSS hides sidebar/topbar/buttons and forces desktop layout. `PrintButton` wired into all 3 detail pages.
- [x] **CSV export** on receipts/issues/transfers/audit lists (respects current filter set)
- [x] **Date range filters** (`dateFrom` / `dateTo`) on all 3 document lists
- [ ] Bulk actions (deferred — single-row cancel covers ~90% of need)

Added in this slice:
- `app/(protected)/products/[id]/movements/page.tsx` + nav button from product detail
- 3 cancel service methods + 3 API routes + `CancelDocumentButton` component
- `PrintButton` component + global print CSS rules
- CSV export buttons added to 4 lists, leveraging existing `lib/csv.ts`
- Two new dict keys in i18n: `common.dateFrom/dateTo`, `movements.*`, `cancel.*`, `products.movementHistory/viewHistory`

#### 2.2 Product enhancements ✓ DONE
- [x] **Barcode generation** — `bwip-js` (Node SVG output, no canvas dependency). `Barcode` component renders inline SVG with Code-128 default + EAN-13 option, configurable scale/height. Product detail page shows a rendered barcode panel when the product has a barcode; visible in print view too.
- [ ] ~~Image upload~~ — added in an earlier iteration; later removed (filesystem isn't compatible with Vercel/Render free tiers, and feature isn't required by the project scope). Migration `remove_product_image_url` cleans up the column.
- [ ] Product variants — out of scope

#### 2.3 Search & data density ✓ PARTIAL
- [x] **Global Cmd+K search** — `/api/search?q=` returns up to 6 products + 4 of each document type + 4 users (per role). `CommandPalette` modal with keyboard navigation (↑↓ to move, ↵ to open, esc to close). Triggered from `Cmd+K` (Mac) / `Ctrl+K`, or from a prominent search button in the topbar (shows the keyboard hint). Falls back to **«Жылдам әрекеттер»** quick actions list (new receipt/issue/transfer/product) when empty.
- [ ] Server-side pagination — deferred; current dataset is small enough that client filtering is acceptable
- [ ] Saved filters per user — deferred

#### 2.4 UX polish
- [ ] Keyboard shortcuts on desktop (n=new, /=focus search, esc=close)
- [ ] Confirmation dialogs for destructive actions
- [ ] Better mobile gestures (swipe-to-delete on cards?)
- [ ] Skeleton states match final layout (no layout shift)

---

### Phase 3 — Advanced features (optional, post-defense)

- [ ] **Write-off documents** — separate document type for damaged/expired goods
- [ ] **Inventory sessions** — physical count workflow with discrepancy resolution
- [x] **Barcode scanning** ✓ DONE — `@zxing/browser` `BrowserMultiFormatReader`, `BarcodeScanner` modal with live camera feed + targeting reticle, `ScanProductButton` next to product select in Receipt/Issue/Transfer item rows. Scanned code looked up via `GET /api/products/by-barcode?code=…` (matches `barcode` OR `sku`); found → product auto-selected + success toast; not-found → friendly Kazakh error.
- [ ] **Low-stock email alerts** — daily digest to managers
- [ ] **Multi-warehouse reservations** — soft-lock stock for pending issues
- [ ] **Supplier order management** — purchase orders → expected receipts
- [ ] **Custom reports** — pivot builder for stock movements
- [ ] **External API** — read-only REST API with token auth for integrations
- [ ] **Telegram/WhatsApp bot** — quick stock queries for sales staff

---

### Phase 4 — Production hardening

- [ ] Unit tests for services (Vitest)
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows (Playwright): login → create receipt → confirm → verify stock
- [ ] GitHub Actions CI (lint + typecheck + tests on PR)
- [ ] Database backup strategy (pg_dump cron)
- [ ] Error monitoring (Sentry free tier)
- [ ] Performance: index review on Prisma schema, slow-query log
- [ ] Deployment: Vercel (frontend + serverless) + Neon/Supabase (Postgres) OR a VPS with Docker Compose
- [ ] `.env` validation at boot (zod)
- [ ] Rate limiting on API routes (`@upstash/ratelimit` or middleware)
- [ ] HTTPS, secure cookies, CSRF (Auth.js handles most)

---

## 6. Updated architecture

```
warehouse-app/
├── app/
│   ├── (protected)/           ← Shared layout (responsive Sidebar + Topbar)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── products/{list, new, [id]}
│   │   ├── categories/  units/  warehouses/  locations/  suppliers/
│   │   ├── documents/{receipts, issues, transfers}/{list, new, [id]}
│   │   ├── stock/
│   │   ├── reports/stock/
│   │   ├── users/{list, new, [id]}
│   │   └── audit/
│   ├── login/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   └── {entity}/...        ← REST-style route handlers
│   └── page.tsx                ← redirects to /dashboard
│
├── components/
│   ├── layout/                 ← Sidebar (with mobile drawer), Topbar (hamburger), PageHeader
│   ├── ui/                     ← Button, Input, Select, Sheet, Modal, Toast, DataTable, StatusBadge, EmptyState, Skeleton
│   ├── forms/                  ← LoginForm, ProductForm, UserForm, ReferenceDataForm
│   ├── documents/              ← ReceiptForm, IssueForm, TransferForm, ItemRows, ConfirmButton
│   └── reports/                ← StockReport, MovementHistory
│
├── lib/
│   ├── i18n/{kk.ts, index.ts}  ← NEW: localization dictionary + t() helper
│   ├── db/                     ← Prisma client singleton
│   ├── auth/                   ← getSession, requireRole
│   ├── permissions/            ← can(role, permission)
│   ├── audit/                  ← logAudit
│   ├── validators/             ← Zod schemas (with Kazakh error messages)
│   ├── services/               ← stock, receipt, issue, transfer, product, user services
│   ├── hooks/                  ← NEW: useMediaQuery, useDebounce, useToast
│   ├── format.ts               ← NEW: date/number/currency for ru-KZ
│   └── cn.ts                   ← NEW: clsx + tailwind-merge
│
├── prisma/{schema.prisma, seed.ts, migrations/}
├── public/
└── types/
```

---

## 7. Permissions matrix (unchanged)

| Section | ADMIN | STOREKEEPER | MANAGER |
|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ |
| Products — view | ✓ | ✓ | ✓ |
| Products — edit | ✓ | ✓ | — |
| Reference data — edit | ✓ | ✓ | — |
| Documents — view | ✓ | ✓ | ✓ |
| Documents — create/confirm | ✓ | ✓ | — |
| Stock — view | ✓ | ✓ | ✓ |
| Reports | ✓ | ✓ | ✓ |
| Users management | ✓ | — | — |
| Audit log | ✓ | — | ✓ |

---

## 8. Key engineering decisions

| Decision | Reasoning |
|---|---|
| Movement-based stock (no balance column) | Auditable, prevents drift, single source of truth |
| All confirms in `prisma.$transaction` | Stock + audit + status must be atomic |
| Soft delete (`isActive`) on all reference data | Preserves historical document integrity |
| Zod schemas shared between client and server | One source of truth for validation |
| Server Components by default | Less JS shipped, faster initial load on mobile |
| Client Components only for interactivity | Forms, drawers, filters |
| Tailwind utility classes — no CSS-in-JS | Predictable, easy to make responsive |
| Kazakh strings in flat `kk.ts` dictionary | No runtime i18n library needed; switchable later |
| Format dates/numbers via `Intl` with `ru-KZ` | Native Kazakh locale support is mature |

---

## 9. Definition of done (MVP)

- [ ] All UI text in Kazakh, verified by a native speaker
- [ ] All MVP pages usable on iPhone SE (375 px wide)
- [ ] All MVP pages usable on 1080p desktop
- [ ] Three roles enforced consistently in UI and API
- [ ] Stock can only be changed by confirming a document (no direct edits)
- [ ] Cancelling a confirmed document is either blocked or properly reverses movements
- [ ] Every mutation logged to `AuditLog`
- [ ] Login → create receipt → confirm → see updated stock → all working
- [ ] No console errors in production build
- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] Seed data demonstrates a realistic working state

---

## 10. Next concrete steps

1. Commit current state (demo removed, plan written)
2. Decide: start Phase 0 with i18n dictionary OR with responsive layout primitives — both are unblocking and can run in parallel
3. After Phase 0: tackle reference data CRUD as the first vertical slice (proves out the full UI → API → DB pattern in Kazakh + responsive)
4. Then products, then documents (most complex)
5. Stock/reports/users/audit last (mostly read-only views)
