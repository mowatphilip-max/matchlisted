"use client";

/* eslint-disable @next/next/no-img-element */
// Always the supplied artwork from /public/brand — never plain type.
// logo-horizontal.png (wordmark + .com) and icon.png (house-heart) are
// Phil's real files. LogoMark below is a faithful SVG recreation of
// icon.png (traced July 2026) so the mark can sit on any surface,
// scale crisply, and animate — the PNGs stay the source of truth for
// raster uses (favicon, social cards).

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function LogoHorizontal({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-horizontal.png"
      alt="Matchlisted.com"
      className={cn("h-10 w-auto", className)}
    />
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <img
      src="/brand/icon.png"
      alt=""
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-horizontal.png"
      alt="Matchlisted.com"
      className={cn("h-6 w-auto", className)}
    />
  );
}

/*
 * The house-heart mark as live vector linework.
 *
 * House strokes render in currentColor (set text-charcoal / text-white on
 * the instance); the heart-tail is always Match Orange. `draw="load"`
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
      viewBox="0 0 240 200"
      fill="none"
      aria-hidden="true"
      className={cn(
        "logo-mark",
        state !== "static" && "logo-armed",
        state === "drawn" && "logo-drawn",
        className,
      )}
    >
      {/* Roofline + chimney */}
      <path
        pathLength={1}
        className="lm-house"
        d="M 8 84 L 120 8 L 169 38 L 169 20 L 197 20 L 197 55 L 233 77"
      />
      {/* Left wall */}
      <path pathLength={1} className="lm-house" d="M 29 83 V 185" />
      {/* Right wall + floor, yielding to the heart's tail */}
      <path pathLength={1} className="lm-house" d="M 212 73 V 190 H 138" />
      {/* The heart, one continuous stroke sweeping out along the floor */}
      <path
        pathLength={1}
        className="lm-heart"
        d="M 28 190 H 88 C 108 190 122 183 134 170 C 152 152 172 121 172 97 C 172 82 161 77 146 77 C 132 77 122 85 117 95 C 111 83 101 77 89 77 C 76 77 66 85 66 98 C 66 112 75 129 91 145 C 97 151 103 156 109 159"
      />
    </svg>
  );
}
