"use client";

// The /seekers directory browser: Variant A cards behind a four-facet
// filter bar (area/town first — a seller's real question is "is anyone
// looking near me?"). All facets combine, filtering is live and client-side
// (142 records — no round trips), state lives in the URL so a filtered view
// can be bookmarked or sent to a seller, and result-count changes are
// announced to screen readers. On mobile the bar collapses into a sheet.

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { MowattSeekerCard } from "./mowatt-seeker-card";
import { PropertyTypeIcon } from "@/components/property-type-icon";
import {
  READINESS_LABELS,
  SEEKER_PROPERTY_TYPES,
  type MowattSeeker,
  type SeekerPropertyType,
  type SeekerReadiness,
} from "@/lib/mowatt-seekers";

const BAND_DEFS = [
  { key: "u300", label: "Under £300k", min: 0, max: 299_999 },
  { key: "300-500", label: "£300k – £500k", min: 300_000, max: 499_999 },
  { key: "500-750", label: "£500k – £750k", min: 500_000, max: 749_999 },
  { key: "750-1m", label: "£750k – £1m", min: 750_000, max: 999_999 },
  { key: "1m+", label: "£1m +", min: 1_000_000, max: Infinity },
] as const;

const PICKABLE_TYPES = SEEKER_PROPERTY_TYPES.filter((t) => t.key !== "any");

function parseList(value: string | null): string[] {
  return value ? value.split(",").map(decodeURIComponent).filter(Boolean) : [];
}

export function SeekersBrowser({ seekers }: { seekers: MowattSeeker[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const uid = useId();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [townQuery, setTownQuery] = useState("");

  // URL is the single source of truth for filter state.
  const selTowns = parseList(params.get("town"));
  const selTypes = parseList(params.get("type")) as SeekerPropertyType[];
  const selBands = parseList(params.get("budget"));
  const selReady = parseList(params.get("ready")) as SeekerReadiness[];
  const activeFilterCount =
    selTowns.length + selTypes.length + selBands.length + selReady.length;

  function setParam(key: string, values: string[]) {
    const next = new URLSearchParams(params.toString());
    if (values.length) next.set(key, values.map(encodeURIComponent).join(","));
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  }
  const toggle = (key: string, list: string[], value: string) =>
    setParam(
      key,
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  const clearAll = () => router.replace(pathname, { scroll: false });

  // Facet options derived from the real data — never hardcoded.
  const townOptions = useMemo(
    () =>
      [...new Set(seekers.flatMap((s) => s.towns))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [seekers],
  );
  const bands = useMemo(
    () =>
      BAND_DEFS.filter((b) =>
        seekers.some(
          (s) => s.active && s.budget && s.budget >= b.min && s.budget <= b.max,
        ),
      ),
    [seekers],
  );
  const readinessOptions = useMemo(
    () =>
      (Object.keys(READINESS_LABELS) as SeekerReadiness[]).filter((r) =>
        seekers.some((s) => s.readiness.includes(r)),
      ),
    [seekers],
  );

  function matches(s: MowattSeeker): boolean {
    if (
      selTowns.length &&
      !s.towns.some((t) =>
        selTowns.some((sel) => sel.toLowerCase() === t.toLowerCase()),
      )
    )
      return false;
    // "Open to any" seekers match EVERY property-type filter, not none.
    if (
      selTypes.length &&
      !s.propertyTypes.includes("any") &&
      !s.propertyTypes.some((t) => selTypes.includes(t))
    )
      return false;
    if (selBands.length) {
      if (!s.budget) return false;
      const inBand = selBands.some((k) => {
        const b = BAND_DEFS.find((d) => d.key === k);
        return b && s.budget! >= b.min && s.budget! <= b.max;
      });
      if (!inBand) return false;
    }
    if (selReady.length && !s.readiness.some((r) => selReady.includes(r)))
      return false;
    return true;
  }

  const activeAll = seekers.filter((s) => s.active);
  const shownActive = activeAll.filter(matches);
  const shownMatched = seekers.filter((s) => !s.active).filter(matches);

  const shownTownOptions = townQuery.trim()
    ? townOptions.filter((t) =>
        t.toLowerCase().includes(townQuery.trim().toLowerCase()),
      )
    : townOptions;

  const chip = (label: string, onRemove: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onRemove}
      className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-charcoal px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-charcoal-deep"
    >
      {label} <X className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">, remove filter</span>
    </button>
  );

  const filterControls = (
    <div className="space-y-5">
      {/* Area / town — the primary facet */}
      <div>
        <label
          htmlFor={`${uid}-town`}
          className="text-xs font-bold uppercase tracking-wider text-charcoal"
        >
          Where&apos;s your home?
        </label>
        <div className="mt-1.5 flex items-center gap-2 rounded-full bg-white py-0.5 pl-3 pr-2 ring-1 ring-hairline focus-within:ring-orange-deep">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            id={`${uid}-town`}
            value={townQuery}
            onChange={(e) => setTownQuery(e.target.value)}
            placeholder="Type a town or area…"
            className="min-h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <div
          className="mt-2 flex max-h-36 flex-wrap content-start gap-1.5 overflow-y-auto"
          role="group"
          aria-label="Filter by town"
        >
          {shownTownOptions.map((t) => {
            const on = selTowns.some(
              (s) => s.toLowerCase() === t.toLowerCase(),
            );
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("town", selTowns, t)}
                className={
                  on
                    ? "cursor-pointer rounded-full bg-orange-deep px-3 py-1.5 text-xs font-semibold text-white"
                    : "cursor-pointer rounded-full bg-white px-3 py-1.5 text-xs font-medium text-charcoal ring-1 ring-hairline transition-colors hover:ring-charcoal/40"
                }
              >
                {t}
              </button>
            );
          })}
          {shownTownOptions.length === 0 && (
            <p className="text-xs text-muted">No towns match that search.</p>
          )}
        </div>
      </div>

      {/* Property type — the icons do double duty as chips */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-charcoal">
          Property type
        </p>
        <div
          className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5"
          role="group"
          aria-label="Filter by property type"
        >
          {PICKABLE_TYPES.map((t) => {
            const on = selTypes.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("type", selTypes, t.key)}
                className={
                  "flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors " +
                  (on
                    ? "border-orange-deep bg-orange-tint text-charcoal ring-1 ring-orange-deep"
                    : "border-hairline bg-white text-charcoal hover:border-charcoal/30")
                }
              >
                <PropertyTypeIcon type={t.key} size={52} />
                <span className="text-[10.5px] font-semibold leading-tight">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Budget bands (only bands the real data fills) */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-charcoal">
            Budget
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by budget">
            {bands.map((b) => {
              const on = selBands.includes(b.key);
              return (
                <button
                  key={b.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle("budget", selBands, b.key)}
                  className={
                    on
                      ? "cursor-pointer rounded-full bg-orange-deep px-3 py-1.5 text-xs font-semibold text-white"
                      : "cursor-pointer rounded-full bg-white px-3 py-1.5 text-xs font-medium text-charcoal ring-1 ring-hairline transition-colors hover:ring-charcoal/40"
                  }
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Readiness */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-charcoal">
            Buyer readiness
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by readiness">
            {readinessOptions.map((r) => {
              const on = selReady.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle("ready", selReady, r)}
                  className={
                    on
                      ? "cursor-pointer rounded-full bg-charcoal px-3 py-1.5 text-xs font-semibold text-white"
                      : "cursor-pointer rounded-full bg-white px-3 py-1.5 text-xs font-medium text-charcoal ring-1 ring-hairline transition-colors hover:ring-charcoal/40"
                  }
                >
                  {READINESS_LABELS[r]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Mobile: collapse into a Filter button + sheet */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-charcoal shadow-[var(--shadow-card)] ring-1 ring-hairline"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-deep px-1.5 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {sheetOpen && (
          <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Filter Quiet Seekers"
            onKeyDown={(e) => e.key === "Escape" && setSheetOpen(false)}
          >
            <button
              type="button"
              aria-label="Close filters"
              className="absolute inset-0 bg-charcoal/40"
              onClick={() => setSheetOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-soft p-5 pb-8 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-base font-bold">Filters</p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="cursor-pointer rounded-full bg-orange-deep px-5 py-2 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
              {filterControls}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: always-visible bar */}
      <div className="hidden rounded-[var(--radius-lg)] bg-soft p-5 ring-1 ring-hairline md:block">
        {filterControls}
      </div>

      {/* Count + active chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p aria-live="polite" className="text-sm text-charcoal-soft">
          Showing <strong className="text-charcoal">{shownActive.length}</strong>{" "}
          of {activeAll.length} Quiet Seekers
        </p>
        {selTowns.map((t) => chip(t, () => toggle("town", selTowns, t)))}
        {selTypes.map((t) =>
          chip(
            SEEKER_PROPERTY_TYPES.find((p) => p.key === t)?.label ?? t,
            () => toggle("type", selTypes, t),
          ),
        )}
        {selBands.map((b) =>
          chip(
            BAND_DEFS.find((d) => d.key === b)?.label ?? b,
            () => toggle("budget", selBands, b),
          ),
        )}
        {selReady.map((r) =>
          chip(READINESS_LABELS[r] ?? r, () => toggle("ready", selReady, r)),
        )}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="cursor-pointer text-xs font-semibold text-orange-deep underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results */}
      {shownActive.length === 0 && shownMatched.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] bg-soft p-8 text-center">
          <p className="text-lg font-bold">
            No Quiet Seekers match those filters yet.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-charcoal-soft">
            New buyers register all the time. Widen the search, or list your
            home and we&apos;ll alert you the moment a matching buyer arrives.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-charcoal ring-1 ring-hairline hover:ring-charcoal/40"
            >
              Clear all filters
            </button>
            <Link
              href="/join?as=seller"
              className="rounded-full bg-orange-deep px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-cta-hover"
            >
              Register your property
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shownActive.map((s) => (
              <MowattSeekerCard key={s.ref} seeker={s} />
            ))}
          </div>

          {shownMatched.length > 0 && (
            <>
              <h2 className="mt-14 text-2xl">
                {shownMatched.length} recently matched
              </h2>
              <p className="mt-1 text-sm text-charcoal-soft">
                These buyers found their home through the Matchlist. Proof
                the quiet route works.
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shownMatched.map((s) => (
                  <div key={s.ref} className="relative">
                    <div className="pointer-events-none select-none opacity-55 grayscale-[0.4]">
                      <MowattSeekerCard seeker={s} />
                    </div>
                    <span className="absolute left-1/2 top-4 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-charcoal/85 px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
                      This buyer has found their home
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
