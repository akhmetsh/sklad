"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";

interface Props {
  docId: string;
  type: "receipt" | "issue" | "transfer";
  status: "DRAFT" | "CONFIRMED" | "CANCELLED" | string;
}

const ENDPOINTS = {
  receipt: (id: string) => `/api/documents/receipts/${id}/cancel`,
  issue: (id: string) => `/api/documents/issues/${id}/cancel`,
  transfer: (id: string) => `/api/documents/transfers/${id}/cancel`,
};

export function CancelDocumentButton({ docId, type, status }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (status === "CANCELLED") return null;

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS[type](docId), { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t.cancel.failed);
        return;
      }
      toast.success(t.cancel.success);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t.errors.network);
    } finally {
      setLoading(false);
    }
  }

  const isConfirmed = status === "CONFIRMED";

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Ban className="w-4 h-4" />
        {t.cancel.action}
      </Button>
      <ConfirmDialog
        open={open}
        title={t.cancel.confirmTitle}
        description={isConfirmed ? t.cancel.confirmDescription : t.cancel.draftDescription}
        destructive
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={handleCancel}
      />
    </>
  );
}
