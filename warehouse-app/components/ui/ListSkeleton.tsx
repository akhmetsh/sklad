import { Skeleton } from "./Skeleton";

/**
 * Skeleton shaped like a typical list page: header, filter row, then table/cards.
 */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 max-w-md" />
        <Skeleton className="h-9 w-44 hidden sm:block" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for detail pages: header + 2 cards.
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-4 max-w-4xl animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-72" />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for form pages.
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4 max-w-2xl animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-56" />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
