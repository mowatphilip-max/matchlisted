// The circular Match % ring badge worn by every home card and profile.
// Orange ring ≥90%, blue 50–89%, grey <50%.

import { matchBand } from "@/lib/match";
import { cn } from "@/lib/utils";

// Rings are non-text UI, so they need 3:1. The previous warm/cool values were
// off-palette one-offs measuring 2.92:1 and 2.61:1 on white — both under that
// bar. These are the palette tokens, which clear it. The warm *label* uses
// blue-text rather than blue-deep because at 11–20px it is small text and
// needs 4.5:1.
const bandColors = {
  hot: { ring: "var(--color-orange)", text: "text-orange-deep" },
  warm: { ring: "var(--color-blue-deep)", text: "text-blue-text" },
  cool: { ring: "var(--color-charcoal-soft)", text: "text-charcoal-soft" },
} as const;

const sizes = {
  sm: { box: 44, stroke: 4, textCls: "text-[11px]" },
  md: { box: 60, stroke: 5, textCls: "text-sm" },
  lg: { box: 88, stroke: 6, textCls: "text-xl" },
} as const;

export function MatchRing({
  pct,
  size = "md",
  className,
  animate = false,
  countUp = false,
}: {
  pct: number;
  size?: keyof typeof sizes;
  className?: string;
  animate?: boolean;
  /** Count the number up 0→pct in sync with the arc sweep (CSS-only). */
  countUp?: boolean;
}) {
  const { box, stroke, textCls } = sizes[size];
  const band = matchBand(pct);
  const { ring, text } = bandColors[band];
  const r = (box - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(pct, 100) / 100);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: box, height: box }}
      role="img"
      aria-label={`${pct}% match`}
    >
      <svg width={box} height={box} className="-rotate-90">
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="white"
          stroke="var(--color-hairline)"
          strokeWidth={stroke}
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="none"
          stroke={ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={animate ? "match-ring-arc" : undefined}
          style={
            animate
              ? ({
                  "--ring-circumference": `${c}`,
                  "--ring-offset": `${offset}`,
                } as React.CSSProperties)
              : undefined
          }
        />
      </svg>
      {countUp ? (
        <span
          aria-hidden="true"
          className={cn(
            "ring-count absolute inset-0 flex items-center justify-center font-bold font-display",
            textCls,
            text,
          )}
          style={{ "--pct-target": pct } as React.CSSProperties}
        />
      ) : (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-bold font-display",
            textCls,
            text,
          )}
        >
          {pct}%
        </span>
      )}
    </div>
  );
}
