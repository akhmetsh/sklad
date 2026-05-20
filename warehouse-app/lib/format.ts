const LOCALE = "kk-KZ";
const TZ = "Asia/Almaty";

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

export function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatMoney(value: number): string {
  return `${formatNumber(value, 0)} ₸`;
}

export function formatQuantity(value: number, unitSymbol?: string): string {
  const num = Number.isInteger(value) ? formatNumber(value, 0) : formatNumber(value, 3);
  return unitSymbol ? `${num} ${unitSymbol}` : num;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
