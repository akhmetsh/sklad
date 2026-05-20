"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  /** Hide on mobile (< md). Useful for secondary columns. */
  hideOnMobile?: boolean;
  /** Mobile label override; defaults to `header` */
  mobileLabel?: ReactNode;
  /** When true, used as the primary line in mobile card view */
  mobilePrimary?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({ columns, data, rowKey, empty, onRowClick, rowClassName }: DataTableProps<T>) {
  if (data.length === 0 && empty) return <>{empty}</>;

  return (
    <>
      {/* Desktop: real table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 font-medium text-gray-500 whitespace-nowrap",
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                      col.className,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("hover:bg-gray-50", onRowClick && "cursor-pointer", rowClassName?.(row))}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3",
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: card view */}
      <div className="md:hidden space-y-2">
        {data.map((row) => {
          const primaryCol = columns.find((c) => c.mobilePrimary) ?? columns[0];
          const secondaryCols = columns.filter((c) => c !== primaryCol && !c.hideOnMobile);
          return (
            <div
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "bg-white border border-gray-200 rounded-lg p-3 space-y-2",
                onRowClick && "active:bg-gray-50",
                rowClassName?.(row),
              )}
            >
              <div className="font-medium text-sm">{primaryCol.cell(row)}</div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {secondaryCols.map((col) => (
                  <div key={col.key} className="flex flex-col">
                    <dt className="text-gray-400">{col.mobileLabel ?? col.header}</dt>
                    <dd className="text-gray-700">{col.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}
