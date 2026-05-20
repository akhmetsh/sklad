"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Tag, Ruler, Warehouse, MapPin, Truck,
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Boxes, BarChart3, Users, ScrollText,
} from "lucide-react";
import { can } from "@/lib/permissions";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import type { Role } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: "viewDocuments" | "viewStock" | "viewReports" | "manageReferenceData" | "manageUsers" | "viewAuditLog" | null;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard, permission: null },
      { href: "/products", label: t.nav.products, icon: Package, permission: "viewDocuments" },
    ],
  },
  {
    title: t.nav.references,
    items: [
      { href: "/categories", label: t.nav.categories, icon: Tag, permission: "manageReferenceData" },
      { href: "/units", label: t.nav.units, icon: Ruler, permission: "manageReferenceData" },
      { href: "/warehouses", label: t.nav.warehouses, icon: Warehouse, permission: "manageReferenceData" },
      { href: "/locations", label: t.nav.locations, icon: MapPin, permission: "manageReferenceData" },
      { href: "/suppliers", label: t.nav.suppliers, icon: Truck, permission: "manageReferenceData" },
    ],
  },
  {
    title: t.nav.documents,
    items: [
      { href: "/documents/receipts", label: t.nav.receipts, icon: ArrowDownToLine, permission: "viewDocuments" },
      { href: "/documents/issues", label: t.nav.issues, icon: ArrowUpFromLine, permission: "viewDocuments" },
      { href: "/documents/transfers", label: t.nav.transfers, icon: ArrowLeftRight, permission: "viewDocuments" },
    ],
  },
  {
    items: [
      { href: "/stock", label: t.nav.stock, icon: Boxes, permission: "viewStock" },
      { href: "/reports/stock", label: t.nav.reports, icon: BarChart3, permission: "viewReports" },
    ],
  },
  {
    title: t.nav.administration,
    items: [
      { href: "/users", label: t.nav.users, icon: Users, permission: "manageUsers" },
      { href: "/audit", label: t.nav.audit, icon: ScrollText, permission: "viewAuditLog" },
    ],
  },
];

interface SidebarProps {
  userRole: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ userRole, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const role = userRole as Role;

  const content = (
    <>
      <div className="h-14 flex items-center px-4 border-b border-slate-700 flex-shrink-0">
        <span className="text-white font-bold text-lg tracking-tight">{t.app.name}</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {SECTIONS.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) => item.permission === null || can(role, item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={sIdx} className="mb-4 last:mb-0">
              {section.title && (
                <p className="px-4 mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
              )}
              {visibleItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-slate-700 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white",
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar: always visible */}
      <aside className="hidden md:flex md:w-60 lg:w-64 flex-shrink-0 bg-slate-800 flex-col">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-gray-900/60" onClick={onMobileClose} aria-hidden />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-slate-800 flex flex-col animate-slide-in-left">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
