"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { can } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const NAV = [
  { href: "/dashboard", label: "Дашборд", permission: null },
  { href: "/products", label: "Товары", permission: "viewDocuments" as const },
  { href: "/categories", label: "Категории", permission: "manageReferenceData" as const },
  { href: "/units", label: "Ед. измерения", permission: "manageReferenceData" as const },
  { href: "/warehouses", label: "Склады", permission: "manageReferenceData" as const },
  { href: "/locations", label: "Места хранения", permission: "manageReferenceData" as const },
  { href: "/suppliers", label: "Поставщики", permission: "manageReferenceData" as const },
  { href: "/documents/receipts", label: "Поступления", permission: "viewDocuments" as const },
  { href: "/documents/issues", label: "Выдачи", permission: "viewDocuments" as const },
  { href: "/documents/transfers", label: "Перемещения", permission: "viewDocuments" as const },
  { href: "/stock", label: "Остатки", permission: "viewStock" as const },
  { href: "/reports/stock", label: "Отчеты", permission: "viewReports" as const },
  { href: "/users", label: "Пользователи", permission: "manageUsers" as const },
  { href: "/audit", label: "Журнал", permission: "viewAuditLog" as const },
];

export function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const role = userRole as Role;

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-800 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-slate-700">
        <span className="text-white font-bold text-lg tracking-tight">Sklad</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.filter((item) => item.permission === null || can(role, item.permission)).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-slate-700 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
