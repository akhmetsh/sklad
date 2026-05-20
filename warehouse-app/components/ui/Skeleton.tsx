import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-200 rounded", className)} />;
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
