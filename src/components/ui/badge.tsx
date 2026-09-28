import { cn } from "@/lib/utils";

// One badge, replacing 40 hand-rolled pills across 16 files that between them
// used seven padding recipes and five type sizes (including text-[9.5px]).
//
// Contrast note: the `blue` tone uses --color-blue-text, not --color-blue-deep.
// A badge is small text by definition, and blue-deep is 3.27:1 on blue-tint —
// it fails AA for anything under 24px. See the palette note in globals.css.

type Tone = "neutral" | "orange" | "blue" | "green" | "red" | "solid";
type Size = "sm" | "md";

const tones: Record<Tone, string> = {
  neutral: "bg-soft text-charcoal ring-1 ring-hairline",
  orange: "bg-orange-tint text-orange-deep ring-1 ring-orange/30",
  blue: "bg-blue-tint text-blue-text ring-1 ring-blue-deep/25",
  green: "bg-green-tint text-green-deep ring-1 ring-green/30",
  red: "bg-red-tint text-red-deep ring-1 ring-red/30",
  solid: "bg-charcoal text-white",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
};

export function Badge({
  tone = "neutral",
  size = "md",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; size?: Size }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold",
        tones[tone],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
