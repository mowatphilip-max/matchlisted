"use client";

// "Live from the Matchlist" — a one-line rotating pill of real, anonymised
// store activity. Social proof with a pulse: newest seekers, hot matches,
// fresh Hush Homes. Pauses on hover/focus; static under reduced motion.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PulseEvent } from "@/lib/pulse";
import { cn } from "@/lib/utils";

export function LiveTicker({
  events,
  className,
}: {
  events: PulseEvent[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || events.length < 2 || reduced.current) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % events.length), 4000);
    return () => clearInterval(t);
  }, [paused, events.length]);

  if (events.length === 0) return null;
  const event = events[index];

  const body = (
    <span key={index} className="ticker-item inline-block truncate">
      {event.text}
    </span>
  );

  return (
    <div
      aria-live="off"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "flex max-w-xl items-center gap-2.5 overflow-hidden rounded-full bg-paper py-2 pl-3.5 pr-4 text-xs font-medium text-charcoal-soft shadow-[var(--shadow-card)] ring-1 ring-hairline",
        className,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
      </span>
      <span className="shrink-0 font-bold uppercase tracking-wider text-green-deep">
        Live
      </span>
      {event.href ? (
        <Link href={event.href} className="min-w-0 truncate hover:text-charcoal hover:underline">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}
