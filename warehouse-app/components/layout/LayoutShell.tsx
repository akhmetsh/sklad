"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";

interface LayoutShellProps {
  userName: string;
  userRole: string;
  children: ReactNode;
}

export function LayoutShell({ userName, userRole, children }: LayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        userRole={userRole}
        mobileOpen={drawerOpen}
        onMobileClose={() => setDrawerOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar
          userName={userName}
          userRole={userRole}
          onMenuClick={() => setDrawerOpen(true)}
          onSearchClick={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} role={userRole} />
    </div>
  );
}
