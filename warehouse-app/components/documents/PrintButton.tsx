"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export function PrintButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()} className="no-print">
      <Printer className="w-4 h-4" />
      {t.common.print}
    </Button>
  );
}
