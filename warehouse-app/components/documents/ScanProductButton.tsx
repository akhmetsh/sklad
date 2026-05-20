"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { BarcodeScanner } from "@/components/ui/BarcodeScanner";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";

interface Props {
  onProductFound: (productId: string) => void;
}

/**
 * Small "scan" trigger used next to product selects in document forms.
 * Opens the camera scanner; on detection, looks up the product by barcode/SKU and calls onProductFound.
 */
export function ScanProductButton({ onProductFound }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  async function handleDetected(code: string) {
    setOpen(false);
    try {
      const res = await fetch(`/api/products/by-barcode?code=${encodeURIComponent(code)}`);
      if (res.status === 404) {
        toast.error(t.products.productByCodeNotFound);
        return;
      }
      if (!res.ok) {
        toast.error(t.errors.generic);
        return;
      }
      const { product } = await res.json();
      onProductFound(product.id);
      toast.success(product.name);
    } catch {
      toast.error(t.errors.network);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-md flex-shrink-0"
        aria-label={t.products.scanBarcode}
        title={t.products.scanBarcode}
      >
        <ScanLine className="w-4 h-4" />
      </button>
      <BarcodeScanner open={open} onClose={() => setOpen(false)} onDetected={handleDetected} />
    </>
  );
}
