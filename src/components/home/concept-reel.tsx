"use client";

// The Concept Reel: the hero's looping ~15s in-code "video" that explains
// Matchlisted in one breath — a Quiet Seeker appears, a Hush Home appears,
// the Matchlist scores them, "It's a match!", a private introduction.
// All timing lives in globals.css on one shared clock (--reel); this file is
// just the scenery plus a pause button (required for auto-motion > 5s).

import { useState } from "react";
import {
  Banknote,
  Bath,
  BedDouble,
  Heart,
  Home,
  MapPin,
  Pause,
  Play,
  Sparkles,
  Trees,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Ring geometry, same math as MatchRing (box 96 / stroke 7).
const BOX = 96;
const STROKE = 7;
const R = (BOX - STROKE) / 2;
const C = 2 * Math.PI * R;
const PCT = 97;
const OFFSET = C * (1 - PCT / 100);

/** animationName-only helper: `.reel-run` supplies duration/loop/timing. */
function run(name: string): React.CSSProperties {
  return { animationName: name };
}

function SeekerMiniCard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={cn(
        "w-[15.5rem] rounded-[var(--radius-lg)] bg-paper p-4 shadow-[var(--shadow-card)] ring-2 ring-blue/40",
        className,
      )}
    >
      <p className="flex items-center gap-2 text-xs font-bold text-blue-deep">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-tint">
          <UserRound className="h-4 w-4" />
        </span>
        Quiet Seeker · QS-2104
      </p>
      <p className="mt-2 font-display text-sm font-bold leading-snug">
        Golf-mad family chasing the coast
      </p>
      <div className="mt-2 space-y-1 text-xs text-charcoal-soft">
        <p className="flex items-center gap-1.5">
          <Banknote className="h-3.5 w-3.5" /> £600,000 – £900,000 · cash
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Gullane · North Berwick · Aberlady
        </p>
      </div>
    </div>
  );
}

function HomeMiniCard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={cn(
        "w-[15.5rem] rounded-[var(--radius-lg)] bg-paper p-4 shadow-[var(--shadow-card)] ring-2 ring-orange/40",
        className,
      )}
    >
      <p className="flex items-center gap-2 text-xs font-bold text-orange-deep">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-tint">
          <Home className="h-4 w-4" />
        </span>
        Hush Home · Gullane
      </p>
      <p className="mt-2 font-display text-sm font-bold leading-snug">
        Golf-view Edwardian villa
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-soft">
        <span className="inline-flex items-center gap-1">
          <BedDouble className="h-3.5 w-3.5" /> 4
        </span>
        <span className="inline-flex items-center gap-1">
          <Bath className="h-3.5 w-3.5" /> 3
        </span>
        <span className="inline-flex items-center gap-1">
          <Trees className="h-3.5 w-3.5" /> Garden
        </span>
        <span className="font-semibold text-charcoal">£875,000</span>
      </div>
    </div>
  );
}

function RingBadge({
  animated,
  className,
  style,
}: {
  animated: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "flex h-24 w-24 items-center justify-center rounded-full bg-paper shadow-[var(--shadow-glow)]",
        className,
      )}
    >
      <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`} className="-rotate-90">
        <circle cx={BOX / 2} cy={BOX / 2} r={R} fill="white" stroke="#E4E7EA" strokeWidth={STROKE} />
        <circle
          cx={BOX / 2}
          cy={BOX / 2}
          r={R}
          fill="none"
          stroke="#F37C24"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={animated ? undefined : OFFSET}
          className={animated ? "reel-run" : undefined}
          style={
            animated
              ? ({
                  animationName: "reel-ring-sweep",
                  "--ring-circumference": `${C}`,
                  "--ring-offset": `${OFFSET}`,
                } as React.CSSProperties)
              : undefined
          }
        />
      </svg>
      {animated ? (
        <span
          aria-hidden="true"
          className="reel-run reel-count absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-orange-deep"
          style={{ animationName: "reel-count", "--pct-target": PCT } as React.CSSProperties}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-orange-deep">
          {PCT}%
        </span>
      )}
    </div>
  );
}

function MatchBanner({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-2xl bg-orange-tint p-4 text-center shadow-[var(--shadow-card)] ring-1 ring-orange/25",
        className,
      )}
    >
      <p className="flex items-center justify-center gap-2 font-display text-xl font-bold text-orange-deep">
        <Sparkles className="h-5 w-5" /> It&apos;s a match!
      </p>
      <p className="mt-1 text-xs font-medium text-charcoal-soft">
        Both sides are told the moment the Matchlist hits 90%+.
      </p>
    </div>
  );
}

// Sparkle burst directions from the ring's centre.
const SPARKS: { dx: number; dy: number; heart?: boolean }[] = [
  { dx: 52, dy: -58, heart: true },
  { dx: 78, dy: -6 },
  { dx: 54, dy: 48 },
  { dx: -52, dy: -58 },
  { dx: -78, dy: -6, heart: true },
  { dx: -54, dy: 48 },
];

export function ConceptReel() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-md" data-paused={paused}>
      {/* Screen readers get the story in one sentence, not 15s of motion. */}
      <p className="sr-only">
        How Matchlisted works: a Quiet Seeker registers a brief, a Hush Home
        lists quietly, and the Matchlist scores the pairing. At 97% it&apos;s a
        match, and we arrange a private introduction. No boards, no portals.
      </p>

      {/* Animated stage (hidden under prefers-reduced-motion). Fixed 28rem
          canvas; .reel-canvas scales it down on narrow phones. */}
      <div aria-hidden="true" className="reel-stage reel-canvas relative h-[26.5rem] w-[28rem] max-w-none">
        <SeekerMiniCard className="reel-run absolute left-0 top-0" style={run("reel-card-left")} />
        <HomeMiniCard className="reel-run absolute right-0 top-[8.75rem]" style={run("reel-card-right")} />

        <div
          className="reel-run absolute left-1/2 top-[6.5rem] z-10 -translate-x-1/2"
          style={run("reel-ring")}
        >
          <RingBadge animated className="relative" />
          {/* Sparkle burst on the match moment */}
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="reel-run absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={
                {
                  animationName: "reel-sparkle",
                  "--dx": `${s.dx}px`,
                  "--dy": `${s.dy}px`,
                } as React.CSSProperties
              }
            >
              {s.heart ? (
                <Heart className="h-3.5 w-3.5 fill-orange text-orange" />
              ) : (
                <span className="block h-2 w-2 rounded-full bg-orange" />
              )}
            </span>
          ))}
        </div>

        <div className="reel-run absolute inset-x-6 top-[18.5rem] z-10" style={run("reel-banner")}>
          <div className="relative">
            <span
              className="reel-run absolute -top-3 left-1/2 z-10 -translate-x-1/2"
              style={run("reel-heart")}
            >
              <Heart className="h-7 w-7 fill-orange text-orange drop-shadow" />
            </span>
            <MatchBanner />
          </div>
        </div>

        <p
          className="reel-run absolute inset-x-0 bottom-0 text-center font-display text-sm font-bold tracking-wide text-charcoal"
          style={run("reel-caption")}
        >
          A private introduction. No boards, no portals.
        </p>
      </div>

      {/* Static tableau for reduced motion: the story's final frame. */}
      <div aria-hidden="true" className="reel-static">
        <div className="reel-canvas relative h-[26.5rem] w-[28rem] max-w-none">
          <SeekerMiniCard className="absolute left-0 top-0 -rotate-1" />
          <HomeMiniCard className="absolute right-0 top-[8.75rem] rotate-1" />
          <RingBadge
            animated={false}
            className="absolute left-1/2 top-[6.5rem] z-10 -translate-x-1/2"
          />
          <MatchBanner className="absolute inset-x-6 top-[18.5rem] z-10" />
          <p className="absolute inset-x-0 bottom-0 text-center font-display text-sm font-bold tracking-wide text-charcoal">
            A private introduction. No boards, no portals.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play the animation" : "Pause the animation"}
        className="absolute -bottom-2 right-0 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-charcoal-soft shadow-[var(--shadow-card)] ring-1 ring-hairline transition-colors hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep"
      >
        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </button>
    </div>
  );
}
