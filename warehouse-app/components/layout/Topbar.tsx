"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Menu, LogOut, User as UserIcon, Search } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { RoleBadge } from "@/components/ui/StatusBadge";

interface TopbarProps {
  userName: string;
  userRole: string;
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function Topbar({ userName, userRole, onMenuClick, onSearchClick }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <header className="h-14 flex items-center justify-between gap-3 px-4 sm:px-6 bg-white border-b border-gray-200 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden -ml-2 p-2 text-gray-600 hover:text-gray-900"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Global search trigger */}
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 transition-colors flex-1 max-w-md md:max-w-sm md:mr-auto md:ml-0"
        aria-label={t.common.search}
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline truncate">{t.common.searchPlaceholder}</span>
        <span className="sm:hidden truncate">{t.common.search}</span>
        <kbd className="hidden md:inline ml-auto font-mono text-xs px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-400">
          {isMac ? "⌘K" : "Ctrl+K"}
        </kbd>
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors",
            menuOpen && "bg-gray-100",
          )}
        >
          <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {userName.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="hidden sm:flex flex-col items-start min-w-0">
            <span className="text-sm text-gray-700 truncate max-w-[160px]">{userName}</span>
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              </div>
              <RoleBadge role={userRole} />
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              {t.auth.signOut}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
