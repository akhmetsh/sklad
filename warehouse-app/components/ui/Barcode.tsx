"use client";

import { useEffect, useRef, useState } from "react";
import bwipjs from "bwip-js/browser";

interface BarcodeProps {
  value: string;
  /** "code128" works for any alphanumeric SKU; "ean13" only for 12-digit numeric codes (13th is checksum) */
  type?: "code128" | "ean13";
  height?: number;
  scale?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Client-side barcode renderer.
 *
 * Originally implemented as a Server Component using `bwip-js/node`, but that
 * version proved fragile on Render's Node runtime (silent empty output).
 * Rendering in the browser via `toCanvas` is consistent everywhere and the
 * library lives in the client bundle anyway (we already use it for the
 * scanner via @zxing/browser).
 */
export function Barcode({
  value,
  type = "code128",
  height = 12,
  scale = 2,
  showText = true,
  className,
}: BarcodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    setError(null);
    try {
      bwipjs.toCanvas(canvasRef.current, {
        bcid: type,
        text: value,
        scale,
        height,
        includetext: showText,
        textxalign: "center",
        textsize: 10,
        paddingwidth: 5,
        paddingheight: 5,
        backgroundcolor: "ffffff",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[Barcode] toCanvas threw for value:", value, msg);
      setError(msg);
    }
  }, [value, type, height, scale, showText]);

  if (!value) return null;

  if (error) {
    return (
      <div className="text-xs text-red-600 font-mono py-2">
        ⚠ Barcode render error: {error} (value: {value})
      </div>
    );
  }

  return <canvas ref={canvasRef} className={className} />;
}
