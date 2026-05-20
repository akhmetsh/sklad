"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X } from "lucide-react";
import { t } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    let controls: { stop: () => void } | null = null;

    (async () => {
      try {
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result) {
            const code = result.getText().trim();
            if (code) {
              controls?.stop();
              onDetected(code);
            }
          }
        });
      } catch {
        setError(t.products.scannerError);
      }
    })();

    return () => {
      controls?.stop();
      readerRef.current = null;
    };
  }, [open, onDetected]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-md bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full"
          aria-label={t.common.close}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative aspect-[4/3] bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-red-300">{error}</div>
          ) : (
            <>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
              {/* Targeting reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-1/3 border-2 border-white/70 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
              </div>
            </>
          )}
        </div>

        <p className="px-4 py-3 text-sm text-gray-200 text-center">{t.products.scannerHint}</p>
      </div>
    </div>
  );
}
