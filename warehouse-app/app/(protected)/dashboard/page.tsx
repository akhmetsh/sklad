import Link from "next/link";
import { Package, Warehouse, MapPin, AlertTriangle, FileEdit, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getMovementHistory, getStockSummary } from "@/lib/services/stock.service";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovementBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Role } from "@prisma/client";

export default async function DashboardPage() {
  const session = await getSession();
  const role = session.user.role as Role;

  const [totalProducts, totalWarehouses, totalLocations, recentMovements, draftReceipts, draftIssues, draftTransfers, stockRows] =
    await Promise.all([
      db.product.count({ where: { isActive: true } }),
      db.warehouse.count({ where: { isActive: true } }),
      db.storageLocation.count({ where: { isActive: true } }),
      getMovementHistory({ limit: 5 }),
      db.receiptDocument.count({ where: { status: "DRAFT" } }),
      db.issueDocument.count({ where: { status: "DRAFT" } }),
      db.transferDocument.count({ where: { status: "DRAFT" } }),
      getStockSummary({}),
    ]);

  const draftCount = draftReceipts + draftIssues + draftTransfers;

  // Aggregate stock across locations per product, then filter low-stock
  const perProduct = new Map<string, { product: typeof stockRows[number]["product"]; totalQuantity: number }>();
  for (const row of stockRows) {
    const existing = perProduct.get(row.product.id);
    const qty = Number(row.quantity);
    if (existing) existing.totalQuantity += qty;
    else perProduct.set(row.product.id, { product: row.product, totalQuantity: qty });
  }
  const lowStockItems = Array.from(perProduct.values())
    .filter((p) => p.totalQuantity < Number(p.product.minStock))
    .sort((a, b) => a.totalQuantity / Number(a.product.minStock) - b.totalQuantity / Number(b.product.minStock))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.dashboard} description={t.dashboard.subtitle} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Package} label={t.dashboard.stats.products} value={totalProducts} tone="blue" />
        <StatCard icon={Warehouse} label={t.dashboard.stats.warehouses} value={totalWarehouses} tone="gray" />
        <StatCard icon={MapPin} label={t.dashboard.stats.locations} value={totalLocations} tone="gray" />
        <StatCard icon={AlertTriangle} label={t.dashboard.stats.lowStock} value={lowStockItems.length} tone="red" />
        <StatCard icon={FileEdit} label={t.dashboard.stats.draftDocuments} value={draftCount} tone="yellow" />
      </div>

      {/* Quick actions */}
      {can(role, "createDocuments") && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">{t.dashboard.quickActions.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <QuickAction href="/documents/receipts/new" icon={ArrowDownToLine} label={t.dashboard.quickActions.newReceipt} tone="green" />
            <QuickAction href="/documents/issues/new" icon={ArrowUpFromLine} label={t.dashboard.quickActions.newIssue} tone="orange" />
            <QuickAction href="/documents/transfers/new" icon={ArrowLeftRight} label={t.dashboard.quickActions.newTransfer} tone="blue" />
          </div>
        </div>
      )}

      {/* Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent movements */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-medium text-gray-900">{t.dashboard.recentMovements}</h2>
          </div>
          {recentMovements.length === 0 ? (
            <EmptyState title={t.dashboard.empty} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentMovements.map((m) => (
                <li key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.warehouse.name} · {formatDateTime(m.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <MovementBadge type={m.movementType} />
                    <span className={`text-sm font-mono font-semibold ${Number(m.quantityChange) < 0 ? "text-red-600" : "text-green-700"}`}>
                      {Number(m.quantityChange) > 0 ? "+" : ""}{formatQuantity(Number(m.quantityChange))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-medium text-gray-900">{t.dashboard.lowStockProducts}</h2>
          </div>
          {lowStockItems.length === 0 ? (
            <EmptyState title={t.status.normal} description={t.dashboard.empty} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {lowStockItems.map((item) => (
                <li key={item.product.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{item.product.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-red-600">{formatQuantity(item.totalQuantity, item.product.unit.symbol)}</p>
                    <p className="text-xs text-gray-400">min. {formatQuantity(Number(item.product.minStock), item.product.unit.symbol)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const toneStyles = {
  blue: "bg-blue-50 text-blue-700",
  gray: "bg-gray-50 text-gray-700",
  red: "bg-red-50 text-red-700",
  yellow: "bg-yellow-50 text-yellow-700",
  green: "bg-green-50 text-green-700",
  orange: "bg-orange-50 text-orange-700",
};

function StatCard({
  icon: Icon, label, value, tone,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: keyof typeof toneStyles }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${toneStyles[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
    </div>
  );
}

function QuickAction({
  href, icon: Icon, label, tone,
}: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; tone: keyof typeof toneStyles }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-brand-400 hover:shadow-sm transition-all"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneStyles[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}
