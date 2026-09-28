import {
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// One callout, replacing 8+ recipes for "tinted panel with a message" that used
// three radii, three paddings and a ring at random. Crucially these now carry a
// live region: `grep aria-live` previously found it in 4 files site-wide, so a
// screen-reader user was told nothing when a form came back with an error.
//
// `tone="error"` uses role="alert" (interrupts); everything else uses
// role="status" (announced politely, does not interrupt typing).

type Tone = "info" | "success" | "warning" | "error";

const tones: Record<Tone, { panel: string; icon: string; Icon: LucideIcon }> = {
  info: {
    panel: "bg-blue-tint ring-blue-deep/20",
    icon: "text-blue-text",
    Icon: Info,
  },
  success: {
    panel: "bg-green-tint ring-green/30",
    icon: "text-green-deep",
    Icon: CheckCircle2,
  },
  warning: {
    panel: "bg-orange-tint ring-orange/30",
    icon: "text-orange-deep",
    Icon: AlertTriangle,
  },
  error: {
    panel: "bg-red-tint ring-red/30",
    icon: "text-red-deep",
    Icon: AlertTriangle,
  },
};

export function Alert({
  tone = "info",
  title,
  action,
  className,
  children,
}: {
  tone?: Tone;
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  const { panel, icon, Icon } = tones[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-[var(--radius-lg)] p-4 ring-1",
        panel,
        className,
      )}
    >
      <Icon aria-hidden className={cn("mt-0.5 h-5 w-5 shrink-0", icon)} />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="text-sm font-bold text-charcoal">{title}</p>
        ) : null}
        {children ? (
          <div className={cn("text-sm text-charcoal", title && "mt-1")}>
            {children}
          </div>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
