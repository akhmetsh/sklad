"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: "right" | "left" | "bottom";
  children: ReactNode;
  footer?: ReactNode;
}

export function Sheet({ open, onClose, title, side = "right", children, footer }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const positions = {
    right: "right-0 top-0 bottom-0 w-full sm:max-w-md animate-slide-in-right",
    left: "left-0 top-0 bottom-0 w-full sm:max-w-md animate-slide-in-left",
    bottom: "left-0 right-0 bottom-0 max-h-[90vh] animate-slide-up sm:left-auto sm:right-4 sm:bottom-4 sm:rounded-xl sm:max-w-md",
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} aria-hidden />
      <div className={cn("absolute bg-white shadow-xl flex flex-col", positions[side])}>
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">{children}</div>
        {footer && (
          <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex gap-2 flex-shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}
