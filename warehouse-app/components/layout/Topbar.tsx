"use client";

import { signOut } from "next-auth/react";

export function Topbar({ userName }: { userName: string }) {
  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Выйти
        </button>
      </div>
    </header>
  );
}
