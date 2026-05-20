"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";
interface Toast { id: string; kind: ToastKind; message: string; }

interface ToastCtx {
  toast: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const success = useCallback((m: string) => toast("success", m), [toast]);
  const error = useCallback((m: string) => toast("error", m), [toast]);
  const info = useCallback((m: string) => toast("info", m), [toast]);

  return (
    <Ctx.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const Icon = icons[toast.kind];
  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };
  const iconColors = { success: "text-green-600", error: "text-red-600", info: "text-blue-600" };

  return (
    <div className={cn("pointer-events-auto flex items-start gap-3 border rounded-lg shadow-md px-4 py-3 animate-slide-in-right", colors[toast.kind])}>
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconColors[toast.kind])} />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 -m-1 p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
