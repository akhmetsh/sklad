import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type Tone = "yellow" | "green" | "gray" | "red" | "blue" | "purple" | "orange" | "cyan";

const tones: Record<Tone, string> = {
  yellow: "bg-yellow-100 text-yellow-700",
  green: "bg-green-100 text-green-700",
  gray: "bg-gray-100 text-gray-600",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  cyan: "bg-cyan-100 text-cyan-700",
};

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

const docStatusMap: Record<string, { tone: Tone; label: string }> = {
  DRAFT: { tone: "yellow", label: t.status.draft },
  CONFIRMED: { tone: "green", label: t.status.confirmed },
  CANCELLED: { tone: "gray", label: t.status.cancelled },
};

export function DocumentStatusBadge({ status }: { status: string }) {
  const { tone, label } = docStatusMap[status] ?? { tone: "gray" as const, label: status };
  return <Badge tone={tone}>{label}</Badge>;
}

const roleMap: Record<string, { tone: Tone; label: string }> = {
  ADMIN: { tone: "purple", label: t.roles.ADMIN },
  STOREKEEPER: { tone: "blue", label: t.roles.STOREKEEPER },
  MANAGER: { tone: "green", label: t.roles.MANAGER },
};

export function RoleBadge({ role }: { role: string }) {
  const { tone, label } = roleMap[role] ?? { tone: "gray" as const, label: role };
  return <Badge tone={tone}>{label}</Badge>;
}

export function StockStatusBadge({ quantity, minStock }: { quantity: number; minStock: number }) {
  if (quantity === 0) return <Badge tone="gray">{t.status.empty}</Badge>;
  if (quantity < minStock) return <Badge tone="red">{t.status.low}</Badge>;
  return <Badge tone="green">{t.status.normal}</Badge>;
}

const movementMap: Record<string, { tone: Tone; label: string }> = {
  RECEIPT: { tone: "green", label: "Кіріс" },
  ISSUE: { tone: "orange", label: "Шығыс" },
  TRANSFER_OUT: { tone: "blue", label: "Аударым (−)" },
  TRANSFER_IN: { tone: "cyan", label: "Аударым (+)" },
  WRITE_OFF: { tone: "red", label: "Есептен шығару" },
  INVENTORY_ADJUSTMENT: { tone: "purple", label: "Түгендеу" },
};

export function MovementBadge({ type }: { type: string }) {
  const { tone, label } = movementMap[type] ?? { tone: "gray" as const, label: type };
  return <Badge tone={tone}>{label}</Badge>;
}

/** Legacy compatibility — older pages still import { StatusBadge } */
export function StatusBadge({ type, value }: { type: "document" | "movement"; value: string }) {
  return type === "document" ? <DocumentStatusBadge status={value} /> : <MovementBadge type={value} />;
}
