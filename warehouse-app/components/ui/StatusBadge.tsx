type DocumentStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
type MovementType = "RECEIPT" | "ISSUE" | "TRANSFER_OUT" | "TRANSFER_IN" | "WRITE_OFF" | "INVENTORY_ADJUSTMENT";

const DOCUMENT_STYLES: Record<DocumentStatus, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const DOCUMENT_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Черновик",
  CONFIRMED: "Подтвержден",
  CANCELLED: "Отменен",
};

const MOVEMENT_STYLES: Record<MovementType, string> = {
  RECEIPT: "bg-green-100 text-green-800",
  ISSUE: "bg-orange-100 text-orange-800",
  TRANSFER_OUT: "bg-blue-100 text-blue-800",
  TRANSFER_IN: "bg-cyan-100 text-cyan-800",
  WRITE_OFF: "bg-red-100 text-red-700",
  INVENTORY_ADJUSTMENT: "bg-purple-100 text-purple-800",
};

const MOVEMENT_LABELS: Record<MovementType, string> = {
  RECEIPT: "Поступление",
  ISSUE: "Выдача",
  TRANSFER_OUT: "Перемещение (−)",
  TRANSFER_IN: "Перемещение (+)",
  WRITE_OFF: "Списание",
  INVENTORY_ADJUSTMENT: "Инвентаризация",
};

interface Props {
  type: "document" | "movement";
  value: string;
}

export function StatusBadge({ type, value }: Props) {
  if (type === "document") {
    const v = value as DocumentStatus;
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${DOCUMENT_STYLES[v] ?? "bg-gray-100 text-gray-600"}`}>
        {DOCUMENT_LABELS[v] ?? v}
      </span>
    );
  }

  const v = value as MovementType;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${MOVEMENT_STYLES[v] ?? "bg-gray-100 text-gray-600"}`}>
      {MOVEMENT_LABELS[v] ?? v}
    </span>
  );
}
