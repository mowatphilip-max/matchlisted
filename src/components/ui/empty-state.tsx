import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Eight empty states existed before this; seven were a bare <p> that told the
// user nothing had happened and gave them nothing to do about it. An empty
// state is the one screen where the product is guaranteed to have the user's
// full attention and nothing to show them — `action` is the point of it.

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-dashed border-hairline bg-soft/60 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper text-charcoal-soft ring-1 ring-hairline">
          <Icon aria-hidden className="h-5 w-5" />
        </span>
      ) : null}
      <p className="font-display text-base font-bold text-charcoal">{title}</p>
      {children ? (
        <div className="mx-auto mt-2 max-w-sm text-sm text-charcoal-soft">
          {children}
        </div>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
