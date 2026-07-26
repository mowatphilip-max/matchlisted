"use client";

// "Where are you looking?" — the anonymous visitor's personal hook.
// Type an area, instantly see how many verified Quiet Seekers are looking
// there (data precomputed server-side and passed as a tiny JSON prop).
// The pick is remembered in localStorage so a returning visitor lands on
// "Still looking in North Berwick?" instead of a generic hero.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Search, X } from "lucide-react";
import { getArea, searchAreas, type AreaInfo } from "@/lib/areas";
import { formatBudget } from "@/lib/format";
import type { AreaSeekerStats, AreaStat } from "@/lib/pulse";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ml_area";

function statFor(
  stats: AreaSeekerStats,
  areaId: string,
): { stat: AreaStat; councilWide: boolean } | null {
  const place = stats.byPlace[areaId];
  if (place) return { stat: place, councilWide: false };
  const council = stats.byCouncil[areaId.split("/")[0]];
  if (council) return { stat: council, councilWide: true };
  return null;
}

export function AreaFinder({ stats }: { stats: AreaSeekerStats }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<AreaInfo | null>(null);
  const [remembered, setRemembered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore a remembered area post-hydration only (avoids SSR mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const area = saved ? getArea(saved) : undefined;
      if (area) {
        setPicked(area);
        setRemembered(true);
      }
    } catch {
      // Private mode etc. — the finder still works, it just forgets.
    }
  }, []);

  const results = query.trim() ? searchAreas(query, 6) : [];

  function choose(area: AreaInfo) {
    setPicked(area);
    setRemembered(false);
    setQuery("");
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, area.id);
    } catch {}
  }

  function reset() {
    setPicked(null);
    setRemembered(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    // Focus back so the visitor can type a new area straight away.
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (picked) {
    const found = statFor(stats, picked.id);
    return (
      <div className="fade-up mt-6 max-w-xl rounded-[var(--radius-lg)] bg-paper p-5 shadow-[var(--shadow-card)] ring-1 ring-blue/25">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-blue-deep">
            <MapPin className="h-4 w-4" />
            {remembered ? `Still looking around ${picked.place}?` : picked.place}
          </p>
          <button
            type="button"
            onClick={reset}
            aria-label="Choose a different area"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-charcoal-soft transition-colors hover:bg-soft hover:text-charcoal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {found ? (
          <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
            <strong className="text-charcoal">
              {found.stat.count} verified buyer{found.stat.count === 1 ? "" : "s"}
            </strong>{" "}
            {found.councilWide
              ? `are looking across ${picked.councilName} right now`
              : `are looking in ${picked.place} right now`}{" "}
            — budgets{" "}
            <strong className="text-charcoal">
              {formatBudget(found.stat.budgetMin, found.stat.budgetMax)}
            </strong>
            . One of them could be your buyer.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
            No live seekers in {picked.place} just yet — be the first Hush Home
            there and every new seeker gets scored against yours.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/join?as=seller"
            className="rounded-full bg-orange-deep px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-cta-hover"
          >
            List your home — free
          </Link>
          <Link
            href="/seekers"
            className="rounded-full px-4 py-2 text-xs font-semibold text-blue-deep ring-1 ring-inset ring-blue-deep/50 transition-colors hover:bg-blue-tint"
          >
            See the seekers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-6 max-w-md">
      <label htmlFor="area-finder" className="sr-only">
        Where are you looking?
      </label>
      <div className="flex items-center gap-2 rounded-full bg-paper py-1 pl-4 pr-1 shadow-[var(--shadow-card)] ring-1 ring-hairline focus-within:ring-blue-deep">
        <Search className="h-4 w-4 shrink-0 text-charcoal-soft" />
        <input
          ref={inputRef}
          id="area-finder"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="area-finder-list"
          aria-activedescendant={
            open && results[active] ? `area-opt-${results[active].id}` : undefined
          }
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Where are you looking? Try “North Berwick”…"
          className="min-h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>
      {open && results.length > 0 && (
        <ul
          id="area-finder-list"
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-hairline bg-white p-1.5 shadow-[var(--shadow-card-hover)]"
        >
          {results.map((a, i) => (
            <li key={a.id}>
              <button
                type="button"
                id={`area-opt-${a.id}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault(); // beat the input's onBlur
                  choose(a);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                  i === active ? "bg-blue-tint text-blue-deep" : "text-charcoal",
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-deep" />
                <span className="font-medium">{a.place}</span>
                <span className="text-xs text-charcoal-soft">{a.councilName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
