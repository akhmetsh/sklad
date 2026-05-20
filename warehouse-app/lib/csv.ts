function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(headers: string[], rows: Array<Array<unknown>>): string {
  // BOM for Excel UTF-8 compatibility
  const bom = "﻿";
  const lines = [headers.map(escapeCell).join(";"), ...rows.map((r) => r.map(escapeCell).join(";"))];
  return bom + lines.join("\r\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
