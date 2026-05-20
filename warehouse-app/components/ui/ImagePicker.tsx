"use client";

import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { t } from "@/lib/i18n";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/product-image", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t.errors.generic);
        return;
      }
      const { url } = await res.json();
      onChange(url);
    } catch {
      toast.error(t.errors.network);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-gray-300" />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          {value ? t.products.changeImage : t.products.uploadImage}
        </Button>
        {value && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
            {t.products.removeImage}
          </Button>
        )}
        <p className="text-xs text-gray-400">JPG/PNG/WEBP · ≤4 MB</p>
      </div>
    </div>
  );
}
