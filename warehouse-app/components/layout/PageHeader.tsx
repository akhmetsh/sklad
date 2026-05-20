import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { t } from "@/lib/i18n";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, backHref, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="min-w-0">
        {backHref && (
          <Link href={backHref} className="inline-flex items-center text-xs text-brand-600 hover:underline mb-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            {t.common.back}
          </Link>
        )}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
