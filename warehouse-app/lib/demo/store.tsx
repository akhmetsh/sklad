"use client";

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react";
import { INITIAL_STATE } from "./data";
import { genId, now, computeStock } from "./types";
import type { DemoState, ReceiptDoc, IssueDoc, TransferDoc, Product, DemoUser, StockMovement } from "./types";

type Action =
  | { type: "CREATE_PRODUCT"; p: Product }
  | { type: "UPDATE_PRODUCT"; p: Product }
  | { type: "CREATE_CATEGORY"; name: string; description?: string }
  | { type: "CREATE_UNIT"; name: string; symbol: string }
  | { type: "CREATE_WAREHOUSE"; name: string; address?: string }
  | { type: "CREATE_LOCATION"; warehouseId: string; code: string; name: string }
  | { type: "CREATE_SUPPLIER"; name: string; contactPerson?: string; phone?: string; email?: string; address?: string }
  | { type: "CREATE_RECEIPT"; doc: ReceiptDoc }
  | { type: "CONFIRM_RECEIPT"; id: string }
  | { type: "CREATE_ISSUE"; doc: IssueDoc }
  | { type: "CONFIRM_ISSUE"; id: string }
  | { type: "CREATE_TRANSFER"; doc: TransferDoc }
  | { type: "CONFIRM_TRANSFER"; id: string }
  | { type: "CREATE_USER"; u: DemoUser }
  | { type: "NOTIFY"; message: string; kind: "success" | "error" }
  | { type: "CLEAR_NOTIFY" }
  | { type: "RESET" };

function reducer(state: DemoState, action: Action): DemoState {
  const audit = (userId: string, act: string, entityType: string, entityId: string, details?: string) => ({
    id: genId(), userId, action: act, entityType, entityId, createdAt: now(), details,
  });

  switch (action.type) {
    case "CREATE_PRODUCT":
      return { ...state, products: [...state.products, action.p], auditLog: [audit("u-admin", "CREATE", "Product", action.p.id, action.p.name), ...state.auditLog] };

    case "UPDATE_PRODUCT":
      return { ...state, products: state.products.map((p) => p.id === action.p.id ? action.p : p), auditLog: [audit("u-admin", "UPDATE", "Product", action.p.id, action.p.name), ...state.auditLog] };

    case "CREATE_CATEGORY":
      const cat = { id: genId(), name: action.name, description: action.description, isActive: true };
      return { ...state, categories: [...state.categories, cat], auditLog: [audit("u-admin", "CREATE", "Category", cat.id, cat.name), ...state.auditLog] };

    case "CREATE_UNIT":
      const unit = { id: genId(), name: action.name, symbol: action.symbol, isActive: true };
      return { ...state, units: [...state.units, unit], auditLog: [audit("u-admin", "CREATE", "Unit", unit.id, unit.name), ...state.auditLog] };

    case "CREATE_WAREHOUSE":
      const wh = { id: genId(), name: action.name, address: action.address, isActive: true };
      return { ...state, warehouses: [...state.warehouses, wh], auditLog: [audit("u-admin", "CREATE", "Warehouse", wh.id, wh.name), ...state.auditLog] };

    case "CREATE_LOCATION":
      const loc = { id: genId(), warehouseId: action.warehouseId, code: action.code, name: action.name, isActive: true };
      return { ...state, locations: [...state.locations, loc], auditLog: [audit("u-admin", "CREATE", "StorageLocation", loc.id, loc.name), ...state.auditLog] };

    case "CREATE_SUPPLIER":
      const sup = { id: genId(), name: action.name, contactPerson: action.contactPerson, phone: action.phone, email: action.email, address: action.address, isActive: true };
      return { ...state, suppliers: [...state.suppliers, sup], auditLog: [audit("u-store", "CREATE", "Supplier", sup.id, sup.name), ...state.auditLog] };

    case "CREATE_RECEIPT":
      return { ...state, receipts: [action.doc, ...state.receipts], auditLog: [audit("u-store", "CREATE", "ReceiptDocument", action.doc.id, action.doc.documentNumber), ...state.auditLog] };

    case "CONFIRM_RECEIPT": {
      const doc = state.receipts.find((r) => r.id === action.id);
      if (!doc || doc.status !== "DRAFT") return state;
      const newMovements: StockMovement[] = doc.items.map((item) => ({
        id: genId(), productId: item.productId, warehouseId: doc.warehouseId, storageLocationId: item.storageLocationId,
        quantityChange: item.quantity, movementType: "RECEIPT" as const, sourceDocumentType: "ReceiptDocument",
        sourceDocumentId: doc.id, createdById: "u-store", createdAt: now(),
      }));
      return {
        ...state,
        receipts: state.receipts.map((r) => r.id === action.id ? { ...r, status: "CONFIRMED" } : r),
        movements: [...state.movements, ...newMovements],
        auditLog: [audit("u-store", "CONFIRM", "ReceiptDocument", action.id, `${doc.documentNumber} → CONFIRMED`), ...state.auditLog],
      };
    }

    case "CREATE_ISSUE":
      return { ...state, issues: [action.doc, ...state.issues], auditLog: [audit("u-store", "CREATE", "IssueDocument", action.doc.id, action.doc.documentNumber), ...state.auditLog] };

    case "CONFIRM_ISSUE": {
      const doc = state.issues.find((r) => r.id === action.id);
      if (!doc || doc.status !== "DRAFT") return state;
      const stock = computeStock(state.movements);
      for (const item of doc.items) {
        const balance = stock.find((b) => b.productId === item.productId && b.warehouseId === doc.warehouseId && b.storageLocationId === item.storageLocationId);
        if (!balance || balance.quantity < item.quantity) return { ...state, notification: { message: "Недостаточный остаток для подтверждения!", kind: "error" } };
      }
      const newMovements: StockMovement[] = doc.items.map((item) => ({
        id: genId(), productId: item.productId, warehouseId: doc.warehouseId, storageLocationId: item.storageLocationId,
        quantityChange: -item.quantity, movementType: "ISSUE" as const, sourceDocumentType: "IssueDocument",
        sourceDocumentId: doc.id, createdById: "u-store", createdAt: now(),
      }));
      return {
        ...state,
        issues: state.issues.map((r) => r.id === action.id ? { ...r, status: "CONFIRMED" } : r),
        movements: [...state.movements, ...newMovements],
        auditLog: [audit("u-store", "CONFIRM", "IssueDocument", action.id, `${doc.documentNumber} → CONFIRMED`), ...state.auditLog],
      };
    }

    case "CREATE_TRANSFER":
      return { ...state, transfers: [action.doc, ...state.transfers], auditLog: [audit("u-store", "CREATE", "TransferDocument", action.doc.id, action.doc.documentNumber), ...state.auditLog] };

    case "CONFIRM_TRANSFER": {
      const doc = state.transfers.find((r) => r.id === action.id);
      if (!doc || doc.status !== "DRAFT") return state;
      const stock = computeStock(state.movements);
      for (const item of doc.items) {
        const fromLoc = item.fromStorageLocationId!;
        const balance = stock.find((b) => b.productId === item.productId && b.warehouseId === doc.fromWarehouseId && b.storageLocationId === fromLoc);
        if (!balance || balance.quantity < item.quantity) return { ...state, notification: { message: "Недостаточный остаток для перемещения!", kind: "error" } };
      }
      const newMovements: StockMovement[] = doc.items.flatMap((item) => [
        { id: genId(), productId: item.productId, warehouseId: doc.fromWarehouseId, storageLocationId: item.fromStorageLocationId!, quantityChange: -item.quantity, movementType: "TRANSFER_OUT" as const, sourceDocumentType: "TransferDocument", sourceDocumentId: doc.id, createdById: "u-store", createdAt: now() },
        { id: genId(), productId: item.productId, warehouseId: doc.toWarehouseId, storageLocationId: item.toStorageLocationId!, quantityChange: item.quantity, movementType: "TRANSFER_IN" as const, sourceDocumentType: "TransferDocument", sourceDocumentId: doc.id, createdById: "u-store", createdAt: now() },
      ]);
      return {
        ...state,
        transfers: state.transfers.map((r) => r.id === action.id ? { ...r, status: "CONFIRMED" } : r),
        movements: [...state.movements, ...newMovements],
        auditLog: [audit("u-store", "CONFIRM", "TransferDocument", action.id, `${doc.documentNumber} → CONFIRMED`), ...state.auditLog],
      };
    }

    case "CREATE_USER":
      return { ...state, users: [...state.users, action.u], auditLog: [audit("u-admin", "CREATE", "User", action.u.id, action.u.email), ...state.auditLog] };

    case "NOTIFY":
      return { ...state, notification: { message: action.message, kind: action.kind } };

    case "CLEAR_NOTIFY":
      return { ...state, notification: null };

    case "RESET":
      if (typeof window !== "undefined") localStorage.removeItem("demo-state");
      return INITIAL_STATE;

    default:
      return state;
  }
}

const STORAGE_KEY = "demo-state-v1";

function loadState(): DemoState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...INITIAL_STATE, ...JSON.parse(raw), notification: null } : INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

interface DemoCtx { state: DemoState; dispatch: (a: Action) => void; }
const Ctx = createContext<DemoCtx | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    const { notification, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [state]);

  useEffect(() => {
    if (state.notification) {
      const t = setTimeout(() => dispatch({ type: "CLEAR_NOTIFY" }), 3500);
      return () => clearTimeout(t);
    }
  }, [state.notification]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}
