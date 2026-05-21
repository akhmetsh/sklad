# Қосымша. Жобаның негізгі бастапқы коды

---

## А1. Деректер базасының схемасы (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  STOREKEEPER
  MANAGER
}

enum DocumentStatus {
  DRAFT
  CONFIRMED
  CANCELLED
}

enum MovementType {
  RECEIPT
  ISSUE
  TRANSFER_OUT
  TRANSFER_IN
  WRITE_OFF
  INVENTORY_ADJUSTMENT
}

// ─── Users & Auth ─────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(STOREKEEPER)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  receiptDocuments  ReceiptDocument[]
  issueDocuments    IssueDocument[]
  transferDocuments TransferDocument[]
  stockMovements    StockMovement[]
  auditLogs         AuditLog[]
}

// ─── Reference data (справочники) ─────────────────────────────────────────────

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  isActive    Boolean   @default(true)
  products    Product[]
}

model Unit {
  id       String    @id @default(cuid())
  name     String    @unique
  symbol   String    @unique
  isActive Boolean   @default(true)
  products Product[]
}

model Supplier {
  id            String            @id @default(cuid())
  name          String
  contactPerson String?
  phone         String?
  email         String?
  address       String?
  description   String?
  isActive      Boolean           @default(true)
  receipts      ReceiptDocument[]
}

model Warehouse {
  id          String            @id @default(cuid())
  name        String            @unique
  address     String?
  description String?
  isActive    Boolean           @default(true)
  locations   StorageLocation[]

  receiptDocuments   ReceiptDocument[]
  issueDocuments     IssueDocument[]
  transfersFrom      TransferDocument[] @relation("TransferFrom")
  transfersTo        TransferDocument[] @relation("TransferTo")
  stockMovements     StockMovement[]
}

model StorageLocation {
  id          String    @id @default(cuid())
  warehouseId String
  code        String
  name        String
  description String?
  isActive    Boolean   @default(true)
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])

  receiptItems      ReceiptItem[]
  issueItems        IssueItem[]
  transferItemsFrom TransferItem[] @relation("TransferLocationFrom")
  transferItemsTo   TransferItem[] @relation("TransferLocationTo")
  stockMovements    StockMovement[]

  @@unique([warehouseId, code])
}

model Product {
  id          String   @id @default(cuid())
  name        String
  sku         String   @unique
  barcode     String?
  categoryId  String
  unitId      String
  description String?
  minStock    Decimal  @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category       Category        @relation(fields: [categoryId], references: [id])
  unit           Unit            @relation(fields: [unitId], references: [id])
  receiptItems   ReceiptItem[]
  issueItems     IssueItem[]
  transferItems  TransferItem[]
  stockMovements StockMovement[]
}

// ─── Documents ────────────────────────────────────────────────────────────────

model ReceiptDocument {
  id             String         @id @default(cuid())
  documentNumber String         @unique
  supplierId     String
  warehouseId    String
  date           DateTime
  status         DocumentStatus @default(DRAFT)
  comment        String?
  createdById    String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  supplier    Supplier        @relation(fields: [supplierId], references: [id])
  warehouse   Warehouse       @relation(fields: [warehouseId], references: [id])
  createdBy   User            @relation(fields: [createdById], references: [id])
  items       ReceiptItem[]
}

model ReceiptItem {
  id                String          @id @default(cuid())
  receiptDocumentId String
  productId         String
  storageLocationId String
  quantity          Decimal
  unitPrice         Decimal?
  comment           String?

  receiptDocument ReceiptDocument @relation(fields: [receiptDocumentId], references: [id], onDelete: Cascade)
  product         Product         @relation(fields: [productId], references: [id])
  storageLocation StorageLocation @relation(fields: [storageLocationId], references: [id])
}

model IssueDocument {
  id             String         @id @default(cuid())
  documentNumber String         @unique
  warehouseId    String
  date           DateTime
  recipientName  String
  status         DocumentStatus @default(DRAFT)
  comment        String?
  createdById    String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  warehouse   Warehouse   @relation(fields: [warehouseId], references: [id])
  createdBy   User        @relation(fields: [createdById], references: [id])
  items       IssueItem[]
}

model IssueItem {
  id                String        @id @default(cuid())
  issueDocumentId   String
  productId         String
  storageLocationId String
  quantity          Decimal
  comment           String?

  issueDocument   IssueDocument   @relation(fields: [issueDocumentId], references: [id], onDelete: Cascade)
  product         Product         @relation(fields: [productId], references: [id])
  storageLocation StorageLocation @relation(fields: [storageLocationId], references: [id])
}

model TransferDocument {
  id              String         @id @default(cuid())
  documentNumber  String         @unique
  fromWarehouseId String
  toWarehouseId   String
  date            DateTime
  status          DocumentStatus @default(DRAFT)
  comment         String?
  createdById     String
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  fromWarehouse Warehouse      @relation("TransferFrom", fields: [fromWarehouseId], references: [id])
  toWarehouse   Warehouse      @relation("TransferTo", fields: [toWarehouseId], references: [id])
  createdBy     User           @relation(fields: [createdById], references: [id])
  items         TransferItem[]
}

model TransferItem {
  id                    String           @id @default(cuid())
  transferDocumentId    String
  productId             String
  fromStorageLocationId String
  toStorageLocationId   String
  quantity              Decimal
  comment               String?

  transferDocument    TransferDocument @relation(fields: [transferDocumentId], references: [id], onDelete: Cascade)
  product             Product          @relation(fields: [productId], references: [id])
  fromStorageLocation StorageLocation  @relation("TransferLocationFrom", fields: [fromStorageLocationId], references: [id])
  toStorageLocation   StorageLocation  @relation("TransferLocationTo", fields: [toStorageLocationId], references: [id])
}

// ─── Stock & Audit ────────────────────────────────────────────────────────────

model StockMovement {
  id                 String       @id @default(cuid())
  productId          String
  warehouseId        String
  storageLocationId  String
  quantityChange     Decimal
  movementType       MovementType
  sourceDocumentType String
  sourceDocumentId   String
  createdById        String
  createdAt          DateTime     @default(now())
  comment            String?

  product         Product         @relation(fields: [productId], references: [id])
  warehouse       Warehouse       @relation(fields: [warehouseId], references: [id])
  storageLocation StorageLocation @relation(fields: [storageLocationId], references: [id])
  createdBy       User            @relation(fields: [createdById], references: [id])

  @@index([productId, warehouseId])
  @@index([sourceDocumentId, sourceDocumentType])
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String
  entityType String
  entityId   String
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@index([userId])
}
```

---

## А2. Рөлдік қол жеткізу матрицасы (`lib/permissions/index.ts`)

```typescript
import type { Role } from "@prisma/client";

export const PERMISSIONS = {
  manageUsers: ["ADMIN"] as Role[],
  manageReferenceData: ["ADMIN", "STOREKEEPER"] as Role[],
  createDocuments: ["ADMIN", "STOREKEEPER"] as Role[],
  viewDocuments: ["ADMIN", "STOREKEEPER", "MANAGER"] as Role[],
  viewStock: ["ADMIN", "STOREKEEPER", "MANAGER"] as Role[],
  viewReports: ["ADMIN", "STOREKEEPER", "MANAGER"] as Role[],
  viewAuditLog: ["ADMIN", "MANAGER"] as Role[],
} as const;

export function can(userRole: Role, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(userRole);
}
```

---

## А3. Атомдық аударым операциясы (`lib/services/transfer.service.ts`)

```typescript
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
```

---

## А4. Құжатты растау API маршруты (`app/api/documents/transfers/[id]/confirm/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { confirmTransferDocument } from "@/lib/services/transfer.service";
import { DocumentError } from "@/lib/services/errors";
import { requirePermission, badRequest } from "@/lib/api/helpers";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await requirePermission("createDocuments");
  if ("response" in r) return r.response;

  try {
    await confirmTransferDocument(params.id, r.session.user.id!);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof DocumentError) return badRequest(e.message, e.status);
    return badRequest("Растау мүмкін емес", 500);
  }
}
```

---

## А5. API көмекшілері (`lib/api/helpers.ts`)

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { t } from "@/lib/i18n";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

type Permission = Parameters<typeof can>[1];

/** Returns the session, or a NextResponse to short-circuit the handler. */
export async function requireSession(): Promise<{ session: Session } | { response: NextResponse }> {
  const session = await auth();
  if (!session?.user) return { response: NextResponse.json({ error: t.errors.forbidden }, { status: 401 }) };
  return { session };
}

export async function requirePermission(permission: Permission): Promise<{ session: Session } | { response: NextResponse }> {
  const result = await requireSession();
  if ("response" in result) return result;
  if (!can(result.session.user.role as Role, permission)) {
    return { response: NextResponse.json({ error: t.errors.forbidden }, { status: 403 }) };
  }
  return result;
}

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function notFound() {
  return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
}
```

---

## А6. Аутентификация конфигурациясы (`auth.config.ts` + `auth.ts`)

### А6.1. Edge-safe бөлік (`auth.config.ts`)

```typescript
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  // Trust the Host header (we sit behind Render/Vercel/nginx, which terminate TLS
  // and forward via X-Forwarded-* headers). Without this, Auth.js v5 refuses to
  // construct URLs from request headers and throws UntrustedHost.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin) return isLoggedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  providers: [],
};
```

### А6.2. Толық конфигурация bcryptjs + Prisma адаптерімен (`auth.ts`)

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.isActive) return null;

        const passwordValid = await compare(parsed.data.password, user.passwordHash);
        if (!passwordValid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
```

---

## А7. Деректерді тексеру схемалары (`lib/validators/document.ts`)

```typescript
import { z } from "zod";
import { t } from "@/lib/i18n";

const req = t.validation.required;
const positive = t.validation.positiveNumber;

export const receiptItemSchema = z.object({
  productId: z.string().min(1, req),
  storageLocationId: z.string().min(1, req),
  quantity: z.coerce.number().positive(positive),
  unitPrice: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  comment: z.string().optional(),
});

export const receiptDocumentSchema = z.object({
  supplierId: z.string().min(1, req),
  warehouseId: z.string().min(1, req),
  date: z.coerce.date(),
  comment: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, "Кемінде бір позиция қосыңыз"),
});

export const issueItemSchema = z.object({
  productId: z.string().min(1, req),
  storageLocationId: z.string().min(1, req),
  quantity: z.coerce.number().positive(positive),
  comment: z.string().optional(),
});

export const issueDocumentSchema = z.object({
  warehouseId: z.string().min(1, req),
  date: z.coerce.date(),
  recipientName: z.string().min(1, req),
  comment: z.string().optional(),
  items: z.array(issueItemSchema).min(1, "Кемінде бір позиция қосыңыз"),
});

export const transferItemSchema = z.object({
  productId: z.string().min(1, req),
  fromStorageLocationId: z.string().min(1, req),
  toStorageLocationId: z.string().min(1, req),
  quantity: z.coerce.number().positive(positive),
  comment: z.string().optional(),
});

export const transferDocumentSchema = z.object({
  fromWarehouseId: z.string().min(1, req),
  toWarehouseId: z.string().min(1, req),
  date: z.coerce.date(),
  comment: z.string().optional(),
  items: z.array(transferItemSchema).min(1, "Кемінде бір позиция қосыңыз"),
}).refine((d) => d.fromWarehouseId !== d.toWarehouseId, {
  message: "Қоймалар әртүрлі болуы керек",
  path: ["toWarehouseId"],
});

export type ReceiptDocumentInput = z.infer<typeof receiptDocumentSchema>;
export type IssueDocumentInput = z.infer<typeof issueDocumentSchema>;
export type TransferDocumentInput = z.infer<typeof transferDocumentSchema>;
```

---

## А8. Қалдықтарды есептеу (`lib/services/stock.service.ts`)

```typescript
import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function getStockBalance(
  productId: string,
  warehouseId: string,
  storageLocationId: string
): Promise<Decimal> {
  const result = await db.stockMovement.aggregate({
    where: { productId, warehouseId, storageLocationId },
    _sum: { quantityChange: true },
  });
  return result._sum.quantityChange ?? new Decimal(0);
}

export async function checkSufficientStock(
  productId: string,
  warehouseId: string,
  storageLocationId: string,
  required: Decimal
): Promise<boolean> {
  const balance = await getStockBalance(productId, warehouseId, storageLocationId);
  return balance.greaterThanOrEqualTo(required);
}

export async function getStockSummary(filters: {
  warehouseId?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}) {
  const movements = await db.stockMovement.groupBy({
    by: ["productId", "warehouseId", "storageLocationId"],
    _sum: { quantityChange: true },
    where: {
      warehouseId: filters.warehouseId,
      product: filters.categoryId ? { categoryId: filters.categoryId } : undefined,
    },
  });

  const productIds = Array.from(new Set(movements.map((m) => m.productId)));
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true, unit: true },
  });

  const warehouses = await db.warehouse.findMany();
  const locations = await db.storageLocation.findMany();

  const rows = movements.map((m) => {
    const product = products.find((p) => p.id === m.productId)!;
    const warehouse = warehouses.find((w) => w.id === m.warehouseId)!;
    const location = locations.find((l) => l.id === m.storageLocationId)!;
    const quantity = m._sum.quantityChange ?? new Decimal(0);

    return {
      product,
      warehouse,
      location,
      quantity,
      isLow: quantity.lessThan(product.minStock),
    };
  });

  return filters.lowStockOnly ? rows.filter((r) => r.isLow) : rows;
}

/**
 * Returns a map of productId -> total quantity across all warehouses/locations.
 * Only products that have any movement history are present.
 */
export async function getStockTotalsByProduct(productIds?: string[]): Promise<Map<string, number>> {
  const grouped = await db.stockMovement.groupBy({
    by: ["productId"],
    _sum: { quantityChange: true },
    where: productIds ? { productId: { in: productIds } } : undefined,
  });
  const map = new Map<string, number>();
  for (const row of grouped) {
    map.set(row.productId, Number(row._sum.quantityChange ?? 0));
  }
  return map;
}

/**
 * Returns per-location stock for a single product (only positive balances).
 */
export async function getProductStockBreakdown(productId: string) {
  const grouped = await db.stockMovement.groupBy({
    by: ["productId", "warehouseId", "storageLocationId"],
    _sum: { quantityChange: true },
    where: { productId },
  });

  const warehouseIds = Array.from(new Set(grouped.map((g) => g.warehouseId)));
  const locationIds = Array.from(new Set(grouped.map((g) => g.storageLocationId)));
  const [warehouses, locations] = await Promise.all([
    db.warehouse.findMany({ where: { id: { in: warehouseIds } } }),
    db.storageLocation.findMany({ where: { id: { in: locationIds } } }),
  ]);

  return grouped
    .map((row) => {
      const quantity = Number(row._sum.quantityChange ?? 0);
      return {
        warehouseId: row.warehouseId,
        warehouseName: warehouses.find((w) => w.id === row.warehouseId)?.name ?? "",
        storageLocationId: row.storageLocationId,
        locationCode: locations.find((l) => l.id === row.storageLocationId)?.code ?? "",
        locationName: locations.find((l) => l.id === row.storageLocationId)?.name ?? "",
        quantity,
      };
    })
    .filter((b) => b.quantity !== 0)
    .sort((a, b) =>
      a.warehouseName.localeCompare(b.warehouseName) || a.locationCode.localeCompare(b.locationCode)
    );
}

export async function getMovementHistory(filters: {
  productId?: string;
  warehouseId?: string;
  limit?: number;
}) {
  return db.stockMovement.findMany({
    where: {
      productId: filters.productId,
      warehouseId: filters.warehouseId,
    },
    include: {
      product: true,
      warehouse: true,
      storageLocation: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
  });
}
```
