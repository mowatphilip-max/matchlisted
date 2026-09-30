"use client";

// The Matchlisted logo, drawn as live SVG from the locked geometry in
// scripts/build-brand.mjs (via the generated logo-paths.ts). Never redraw
// or restyle it here: change the build script and run `npm run build-brand`.
// Static files for everywhere else live in /public/brand (see docs/BRAND.md).

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { LOGO } from "./logo-paths";

/*
 * The name logo: the house, "Match" over "listed.com", the h running down
 * into the d, the small heart as the dot, and the swoosh as the underline.
 * House and name render in currentColor (text-charcoal on light, text-white
 * on dark); the heart, underline and ".com" are always Signal orange.
 *
 * `motion` (keyframes in globals.css):
 *   "intro"  the logo draws itself once, then settles into the pulse loop
 *   "loop"   no intro, just the quiet pulse along the underline
 *   omitted  completely still
 * People who ask for reduced motion always get the still logo.
 */
const N = LOGO.name;

export function Logo({
  className,
  motion,
}: {
  className?: string;
  motion?: "intro" | "loop";
}) {
  const vars = (v: Record<string, string>) => v as CSSProperties;
  const delay = (base: number, i: number) =>
    vars({ "--d": `${(base + i * 0.07).toFixed(2)}s` });
  const houseTiming = [
    vars({ "--d": "0s", "--t": ".8s" }),
    vars({ "--d": ".15s", "--t": ".5s" }),
    vars({ "--d": ".3s", "--t": ".5s" }),
  ];

  return (
    <svg
      viewBox={N.viewBox}
      role="img"
      aria-label="Matchlisted.com"
      className={cn(
        "ml-logo h-10 w-auto overflow-visible",
        motion === "intro" && "ml-intro ml-loop",
        motion === "loop" && "ml-loop",
        className,
      )}
    >
      {N.house.map((d, i) => (
        <path key={d} pathLength={1} className="ml-line ml-house" style={houseTiming[i]} d={d} />
      ))}
      <path pathLength={1} className="ml-line ml-swoosh" d={N.swoosh} />
      {N.match.map((d, i) => (
        <path key={d} className="ml-letter ml-drop" style={delay(0.9, i)} d={d} />
      ))}
      {N.listed.map((d, i) => (
        <path key={d} className="ml-letter ml-rise" style={delay(1.3, i)} d={d} />
      ))}
      <rect
        className="ml-letter ml-pillar"
        x={N.pillar.x}
        y={N.pillar.y}
        width={N.pillar.w}
        height={N.pillar.h}
      />
      <g transform={`translate(${N.dot.tx} ${N.dot.ty}) scale(${N.dot.k})`}>
        <path className="ml-dot" d={N.dot.d} />
      </g>
      {N.com.map((d, i) => (
        <path key={d} className="ml-letter ml-com ml-rise" style={delay(2.3, i)} d={d} />
      ))}
      {motion && <path pathLength={1} className="ml-spark" d={N.swoosh} />}
    </svg>
  );
}

/*
 * The house-heart mark as live vector linework.
 *
 * House strokes render in currentColor (set text-charcoal / text-white on
 * the instance); the heart and its short swoosh are always Signal orange. `draw="load"`
 * traces the linework on mount; `draw="view"` waits until scrolled into
 * view (and degrades to the static mark if JS never runs).
 */
export function LogoMark({
  className,
  draw,
}: {
  className?: string;
  draw?: "load" | "view";
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [state, setState] = useState<"static" | "armed" | "drawn">(
    draw === "load" ? "drawn" : "static",
  );

  useEffect(() => {
    if (draw !== "view") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("drawn");
          io.disconnect();
        } else {
          setState((s) => (s === "drawn" ? s : "armed"));
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [draw]);

  return (
    <svg
      ref={ref}
      viewBox={LOGO.markViewBox}
      fill="none"
      aria-hidden="true"
      className={cn(
        "logo-mark",
        state !== "static" && "logo-armed",
        state === "drawn" && "logo-drawn",
        className,
      )}
    >
      {LOGO.house.map((d) => (
        <path key={d} pathLength={1} className="lm-house" d={d} />
      ))}
      {/* The heart, one continuous stroke sweeping out along the floor */}
      <path
        pathLength={1}
        className="lm-heart"
        d={`${LOGO.heart} H${LOGO.markTail}`}
      />
    </svg>
  );
}
