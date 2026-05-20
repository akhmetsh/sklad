"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{t.errors.generic}</h1>
        {error.digest && <p className="text-xs text-gray-400 font-mono mb-4">ID: {error.digest}</p>}
        <Button onClick={reset}>
          <RefreshCcw className="w-4 h-4" />
          {t.common.refresh}
        </Button>
      </div>
    </div>
  );
}
