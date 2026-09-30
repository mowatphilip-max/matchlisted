"use client";

// The Matchlisted logo, drawn as live SVG from the locked geometry in
// scripts/build-brand.mjs (via the generated logo-paths.ts). Never redraw
// or restyle it here: change the build script and run `npm run build-brand`.
// Static files for everywhere else live in /public/brand (see docs/BRAND.md).

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LOGO } from "./logo-paths";

/*
 * The full horizontal logo: house-heart mark, with the swoosh running on
 * as the underline beneath "Matchlisted.com". House and name render in
 * currentColor (text-charcoal on light, text-white on dark); the heart,
 * underline and ".com" are always Signal orange.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox={LOGO.lockupViewBox}
      role="img"
      aria-label="Matchlisted.com"
      className={cn("logo-mark h-10 w-auto", className)}
    >
      {LOGO.house.map((d) => (
        <path key={d} className="lm-house" d={d} />
      ))}
      <path className="lm-swoosh" d={`${LOGO.heart} H${LOGO.lockupTail}`} />
      <g transform={LOGO.wordTransform}>
        <path fill="currentColor" d={LOGO.wordName} />
        <path className="lm-com" d={LOGO.wordCom} />
      </g>
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
