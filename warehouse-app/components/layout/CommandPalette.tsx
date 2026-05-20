"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, User as UserIcon, FileText, Plus } from "lucide-react";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import type { Role } from "@prisma/client";

type Kind = "product" | "receipt" | "issue" | "transfer" | "user";

interface SearchResult {
  kind: Kind; id: string; label: string; hint?: string; href: string;
}

interface QuickAction {
  kind: "action"; label: string; hint?: string; href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ICONS: Record<Kind, React.ComponentType<{ className?: string }>> = {
  product: Package,
  receipt: ArrowDownToLine,
  issue: ArrowUpFromLine,
  transfer: ArrowLeftRight,
  user: UserIcon,
};

interface Props {
  open: boolean;
  onClose: () => void;
  role: string;
}

export function CommandPalette({ open, onClose, role }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const quickActions: QuickAction[] = [];
  if (can(role as Role, "createDocuments")) {
    quickActions.push(
      { kind: "action", label: t.dashboard.quickActions.newReceipt, href: "/documents/receipts/new", icon: ArrowDownToLine },
      { kind: "action", label: t.dashboard.quickActions.newIssue, href: "/documents/issues/new", icon: ArrowUpFromLine },
      { kind: "action", label: t.dashboard.quickActions.newTransfer, href: "/documents/transfers/new", icon: ArrowLeftRight },
    );
  }
  if (can(role as Role, "manageReferenceData")) {
    quickActions.push({ kind: "action", label: t.products.create, href: "/products/new", icon: Package });
  }

  // Items to display: results when query, else quick actions
  const items: (SearchResult | QuickAction)[] = query.trim().length >= 2 ? results : quickActions;

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setHighlighted(0);
      // Focus next tick after the modal mounts
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setHighlighted(0);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
          setHighlighted(0);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, items.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = items[highlighted];
        if (item) {
          router.push(item.href);
          onClose();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, items, highlighted, onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden mt-12 sm:mt-20">
        <div className="flex items-center gap-2 px-4 border-b border-gray-200">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="flex-1 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
            autoComplete="off"
          />
          {loading && (
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
          )}
        </div>

        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {query.trim().length >= 2 ? t.common.noResults : t.common.searchPlaceholder}
            </div>
          ) : (
            <>
              {query.trim().length < 2 && (
                <p className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-400">{t.common.quickActions}</p>
              )}
              <ul>
                {items.map((item, idx) => {
                  const Icon = item.kind === "action" ? item.icon : ICONS[item.kind];
                  const isAction = item.kind === "action";
                  return (
                    <li key={`${item.kind}-${"id" in item ? item.id : idx}`}>
                      <button
                        type="button"
                        onClick={() => { router.push(item.href); onClose(); }}
                        onMouseEnter={() => setHighlighted(idx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          highlighted === idx ? "bg-brand-50" : "hover:bg-gray-50",
                        )}
                      >
                        <span className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
                          isAction ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500",
                        )}>
                          {isAction ? <Plus className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-gray-900 truncate">{item.label}</span>
                          {item.hint && <span className="block text-xs text-gray-500 truncate">{item.hint}</span>}
                        </span>
                        {!isAction && (
                          <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          <span><kbd className="font-mono px-1.5 py-0.5 bg-white border border-gray-200 rounded">↑↓</kbd> жылжу</span>
          <span><kbd className="font-mono px-1.5 py-0.5 bg-white border border-gray-200 rounded">↵</kbd> ашу</span>
          <span><kbd className="font-mono px-1.5 py-0.5 bg-white border border-gray-200 rounded">esc</kbd> жабу</span>
        </div>
      </div>
    </div>
  );
}
