export type DocStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
export type MovementType = "RECEIPT" | "ISSUE" | "TRANSFER_OUT" | "TRANSFER_IN" | "WRITE_OFF" | "INVENTORY_ADJUSTMENT";
export type UserRole = "ADMIN" | "STOREKEEPER" | "MANAGER";

export interface DemoUser { id: string; name: string; email: string; role: UserRole; isActive: boolean; createdAt: string; }
export interface Category { id: string; name: string; description?: string; isActive: boolean; }
export interface Unit { id: string; name: string; symbol: string; isActive: boolean; }
export interface Warehouse { id: string; name: string; address?: string; description?: string; isActive: boolean; }
export interface StorageLocation { id: string; warehouseId: string; code: string; name: string; isActive: boolean; }
export interface Supplier { id: string; name: string; contactPerson?: string; phone?: string; email?: string; address?: string; isActive: boolean; }

export interface Product {
  id: string; name: string; sku: string; barcode?: string;
  categoryId: string; unitId: string; description?: string;
  minStock: number; isActive: boolean; createdAt: string;
}

export interface DocItem {
  id: string; productId: string; storageLocationId: string; quantity: number;
  unitPrice?: number; comment?: string;
  fromStorageLocationId?: string; toStorageLocationId?: string;
}

export interface ReceiptDoc {
  id: string; documentNumber: string; supplierId: string; warehouseId: string;
  date: string; status: DocStatus; comment?: string; createdById: string; createdAt: string;
  items: DocItem[];
}

export interface IssueDoc {
  id: string; documentNumber: string; warehouseId: string; recipientName: string;
  date: string; status: DocStatus; comment?: string; createdById: string; createdAt: string;
  items: DocItem[];
}

export interface TransferDoc {
  id: string; documentNumber: string; fromWarehouseId: string; toWarehouseId: string;
  date: string; status: DocStatus; comment?: string; createdById: string; createdAt: string;
  items: DocItem[];
}

export interface StockMovement {
  id: string; productId: string; warehouseId: string; storageLocationId: string;
  quantityChange: number; movementType: MovementType;
  sourceDocumentType: string; sourceDocumentId: string;
  createdById: string; createdAt: string; comment?: string;
}

export interface AuditEntry {
  id: string; userId: string; action: string; entityType: string;
  entityId: string; createdAt: string; details?: string;
}

export interface DemoState {
  users: DemoUser[];
  categories: Category[];
  units: Unit[];
  warehouses: Warehouse[];
  locations: StorageLocation[];
  suppliers: Supplier[];
  products: Product[];
  receipts: ReceiptDoc[];
  issues: IssueDoc[];
  transfers: TransferDoc[];
  movements: StockMovement[];
  auditLog: AuditEntry[];
  notification: { message: string; kind: "success" | "error" } | null;
}

export interface StockBalance {
  productId: string; warehouseId: string; storageLocationId: string; quantity: number;
}

export function computeStock(movements: StockMovement[]): StockBalance[] {
  const map = new Map<string, number>();
  for (const m of movements) {
    const key = `${m.productId}::${m.warehouseId}::${m.storageLocationId}`;
    map.set(key, (map.get(key) ?? 0) + m.quantityChange);
  }
  return Array.from(map.entries())
    .map(([key, quantity]) => {
      const [productId, warehouseId, storageLocationId] = key.split("::");
      return { productId, warehouseId, storageLocationId, quantity };
    })
    .filter((b) => b.quantity > 0);
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function now(): string {
  return new Date().toISOString();
}
