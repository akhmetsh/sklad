"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  docId: string;
  type: "receipt" | "issue" | "transfer";
  label?: string;
}

const ENDPOINTS = {
  receipt: (id: string) => `/api/documents/receipts/${id}/confirm`,
  issue: (id: string) => `/api/documents/issues/${id}/confirm`,
  transfer: (id: string) => `/api/documents/transfers/${id}/confirm`,
};

export function ConfirmDocumentButton({ docId, type, label = "Подтвердить" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!confirm("Подтвердить документ? Остатки будут изменены.")) return;

    setLoading(true);
    const res = await fetch(ENDPOINTS[type](docId), { method: "POST" });
    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Ошибка подтверждения");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60"
    >
      {loading ? "Обработка..." : label}
    </button>
  );
}
