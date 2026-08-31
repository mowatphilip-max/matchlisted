"use client";

// The four strokes of the public Match Report (BUILD-BRIEF.md §6.1):
// area · bedrooms · property type · value band. No account, no card, no
// address. Submits as a plain GET so the report URL is shareable and the
// form works with JavaScript disabled; the typeahead is enhancement only.
//
// The area picked on the homepage finder is remembered in localStorage
// ("ml_area") — if the visitor arrives without an ?area= we prefill from
// there so a returning seller is one tap from their report.

import { useRef, useState, useSyncExternalStore } from "react";
import { MapPin, Search, X } from "lucide-react";
import { getArea, searchAreas, type AreaInfo } from "@/lib/areas";
import { CONFIG } from "@/lib/site";
import { PROPERTY_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ml_area";

export interface ReportFormInitial {
  areaId?: string;
  beds?: number;
  type?: string;
  band?: string;
}

const selectCls =
  "min-h-12 w-full cursor-pointer rounded-xl border border-hairline bg-white px-3.5 text-sm text-charcoal outline-none focus:border-blue-deep";

const noopSubscribe = () => () => {};
function rememberedAreaId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode etc. — the form still works, it just starts blank.
    return null;
  }
}

export function MatchReportForm({ initial }: { initial: ReportFormInitial }) {
  const [chosen, setChosen] = useState<AreaInfo | null>(
    initial.areaId ? (getArea(initial.areaId) ?? null) : null,
  );
  const [cleared, setCleared] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // No ?area= in the URL: prefill from the homepage finder's remembered pick
  // (server renders blank; the store read fills it in post-hydration).
  const remembered = useSyncExternalStore(
    noopSubscribe,
    rememberedAreaId,
    () => null,
  );
  const picked =
    chosen ??
    (!cleared && !initial.areaId && remembered
      ? (getArea(remembered) ?? null)
      : null);

  const results = query.trim() ? searchAreas(query, 6) : [];

  function choose(area: AreaInfo) {
    setChosen(area);
    setCleared(false);
    setQuery("");
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, area.id);
    } catch {}
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

  return (
    <form
      action="/match-report"
      method="get"
      className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="relative sm:col-span-2">
          <label
            htmlFor="mr-area"
            className="block text-sm font-semibold text-charcoal"
          >
            Where is your home?
          </label>
          {picked ? (
            <div className="mt-1.5 flex min-h-12 items-center justify-between gap-3 rounded-xl bg-blue-tint px-3.5 ring-1 ring-inset ring-blue-deep/30">
              <p className="flex items-center gap-2 text-sm font-bold text-blue-deep">
                <MapPin className="h-4 w-4 shrink-0" />
                {picked.place}
                <span className="font-normal text-charcoal-soft">
                  {picked.councilName}
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setChosen(null);
                  setCleared(true);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                aria-label="Choose a different area"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-charcoal-soft transition-colors hover:bg-white hover:text-charcoal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-hairline bg-white px-3.5 focus-within:border-blue-deep">
              <Search className="h-4 w-4 shrink-0 text-charcoal-soft" />
              <input
                ref={inputRef}
                id="mr-area"
                role="combobox"
                aria-expanded={open && results.length > 0}
                aria-controls="mr-area-list"
                aria-activedescendant={
                  open && results[active]
                    ? `mr-area-opt-${results[active].id}`
                    : undefined
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
                placeholder="Town or area. Try “Gullane”…"
                className="min-h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
          )}
          <input type="hidden" name="area" value={picked?.id ?? ""} />
          {open && results.length > 0 && (
            <ul
              id="mr-area-list"
              role="listbox"
              className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-hairline bg-white p-1.5 shadow-[var(--shadow-card-hover)]"
            >
              {results.map((a, i) => (
                <li key={a.id}>
                  <button
                    type="button"
                    id={`mr-area-opt-${a.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => {
                      e.preventDefault(); // beat the input's onBlur
                      choose(a);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                      i === active
                        ? "bg-blue-tint text-blue-deep"
                        : "text-charcoal",
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-deep" />
                    <span className="font-medium">{a.place}</span>
                    <span className="text-xs text-charcoal-soft">
                      {a.councilName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label
            htmlFor="mr-beds"
            className="block text-sm font-semibold text-charcoal"
          >
            Bedrooms
          </label>
          <select
            id="mr-beds"
            name="beds"
            required
            defaultValue={initial.beds ? String(initial.beds) : ""}
            className={cn(selectCls, "mt-1.5")}
          >
            <option value="" disabled>
              Choose…
            </option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="6">6 or more</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="mr-type"
            className="block text-sm font-semibold text-charcoal"
          >
            Property type
          </label>
          <select
            id="mr-type"
            name="type"
            required
            defaultValue={initial.type ?? ""}
            className={cn(selectCls, "mt-1.5")}
          >
            <option value="" disabled>
              Choose…
            </option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="mr-band"
            className="block text-sm font-semibold text-charcoal"
          >
            Roughly what it&apos;s worth
          </label>
          <select
            id="mr-band"
            name="band"
            required
            defaultValue={initial.band ?? ""}
            className={cn(selectCls, "mt-1.5")}
          >
            <option value="" disabled>
              Choose a range…
            </option>
            {CONFIG.valueBands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-charcoal-soft">
            Your rough range, just for matching. This is never a valuation and
            we never publish it.
          </p>
        </div>
      </div>

      <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={!picked}>
        Show me who&apos;s waiting
      </Button>
    </form>
  );
}
