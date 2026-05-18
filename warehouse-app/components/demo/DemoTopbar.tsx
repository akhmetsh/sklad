"use client";

import { useDemo } from "@/lib/demo/store";
import { useEffect, useRef } from "react";

export function DemoTopbar() {
  const { state } = useDemo();
  const notif = state.notification;
  const prevRef = useRef(notif);

  useEffect(() => { prevRef.current = notif; }, [notif]);

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-medium">
          Демо-режим — изменения сохраняются локально
        </span>
      </div>
      <div className="flex items-center gap-3">
        {notif && (
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            notif.kind === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {notif.message}
          </span>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">А</div>
          <span>Администратор</span>
        </div>
      </div>
    </header>
  );
}
