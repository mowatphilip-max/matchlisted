import { cn } from "@/lib/utils";

// Placeholder block for streaming route segments. `animate-none` under reduced
// motion is deliberate: the global kill-switch in globals.css collapses
// animation-duration to 0.01ms, which would leave the pulse frozen mid-cycle at
// an arbitrary opacity. Holding one stable tint reads as "loading" just as well.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] bg-hairline/60 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

// The card grids on /seekers, /hush-homes and /matches all share this shape.
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
