import Link from "next/link";
import { PackageX } from "lucide-react";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="text-center max-w-md">
        <PackageX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-6xl font-bold text-gray-300 mb-2">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{t.notFoundPage.title}</h1>
        <p className="text-sm text-gray-500 mb-6">{t.notFoundPage.description}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
        >
          {t.notFoundPage.backHome}
        </Link>
      </div>
    </div>
  );
}
