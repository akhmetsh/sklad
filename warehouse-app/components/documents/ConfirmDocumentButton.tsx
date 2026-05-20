"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";

const ENDPOINTS = {
  receipt: (id: string) => `/api/documents/receipts/${id}/confirm`,
  issue: (id: string) => `/api/documents/issues/${id}/confirm`,
  transfer: (id: string) => `/api/documents/transfers/${id}/confirm`,
};

const SUCCESS: Record<string, string> = {
  receipt: t.documents.receipts.confirmed,
  issue: t.documents.issues.confirmed,
  transfer: t.documents.transfers.confirmed,
};

interface Props {
  docId: string;
  type: "receipt" | "issue" | "transfer";
  label?: string;
}

export function ConfirmDocumentButton({ docId, type, label }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS[type](docId), { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t.errors.generic);
        return;
      }
      toast.success(SUCCESS[type]);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t.errors.network);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="success" onClick={() => setOpen(true)}>
        <CheckCircle2 className="w-4 h-4" />
        {label ?? t.documents.common.confirmAction}
      </Button>
      <ConfirmDialog
        open={open}
        title={label ?? t.documents.common.confirmAction}
        description={t.documents.common.draftNote}
        confirmLabel={t.common.confirm}
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
