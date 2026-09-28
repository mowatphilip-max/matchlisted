"use client";

// The Quiet Seeker brief builder: Scotland-wide area picker (search +
// browse-by-region), a dual-handle log-scaled budget slider (£50k–£5m),
// and the structured preference fields the Matchlist scores against.

import { useMemo, useState } from "react";
import { Check, MapPin, Search, X } from "lucide-react";
import { REGIONS, areaId, areaLabel, searchAreas } from "@/lib/areas";
import { saveBrief } from "@/lib/actions";
import {
  SEEKER_PROPERTY_TYPES,
  type SeekerPropertyType,
} from "@/lib/mowatt-seekers";
import { PropertyTypeIcon } from "@/components/property-type-icon";
import {
  BUYING_POSITIONS,
  FEATURE_TAGS,
  PROPERTY_TYPES,
  type SeekerBrief,
} from "@/lib/types";
import { SubmitButton } from "./ui/submit-button";
import { cn } from "@/lib/utils";

// The picker offers the ten concrete types — "any" is the implicit
// fallback when the step is skipped, never an option you tick.
const PICKER_TYPES = SEEKER_PROPERTY_TYPES.filter((t) => t.key !== "any");

// Budget slider: log scale so the £200k–£600k heartland gets most of the
// travel. t ∈ [0,100] → £50,000 … £5,000,000, snapped to sensible steps.
const MIN = 50000;
const MAX = 5000000;
function tToValue(t: number): number {
  const raw = MIN * Math.pow(MAX / MIN, t / 100);
  const step = raw < 500000 ? 5000 : raw < 1000000 ? 25000 : 50000;
  return Math.min(MAX, Math.max(MIN, Math.round(raw / step) * step));
}
function valueToT(v: number): number {
  return (Math.log(v / MIN) / Math.log(MAX / MIN)) * 100;
}

const gbp = (v: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(v);

export function BriefForm({ brief }: { brief: SeekerBrief | null }) {
  const [areas, setAreas] = useState<string[]>(brief?.areas ?? []);
  const [query, setQuery] = useState("");
  const [browseRegion, setBrowseRegion] = useState<string | null>(null);
  const [tMin, setTMin] = useState(valueToT(brief?.budgetMin ?? 150000));
  const [tMax, setTMax] = useState(valueToT(brief?.budgetMax ?? 450000));
  const [pickedTypes, setPickedTypes] = useState<SeekerPropertyType[]>(
    brief?.propertyTypes ?? [],
  );

  function togglePickedType(key: SeekerPropertyType) {
    setPickedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  const budgetMin = tToValue(Math.min(tMin, tMax));
  const budgetMax = tToValue(Math.max(tMin, tMax));
  const results = useMemo(() => searchAreas(query), [query]);

  function addArea(id: string) {
    setAreas((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setQuery("");
  }

  return (
    <form action={saveBrief} className="space-y-10">
      <input type="hidden" name="areas" value={JSON.stringify(areas)} />
      <input type="hidden" name="budgetMin" value={budgetMin} />
      <input type="hidden" name="budgetMax" value={budgetMax} />
      <input
        type="hidden"
        name="propertyTypes"
        value={JSON.stringify(pickedTypes)}
      />

      {/* Areas */}
      <section>
        <h2 className="text-xl">Where are you looking?</h2>
        <p className="mt-1 text-sm text-charcoal-soft">
          Anywhere in Scotland. Pick as many places as you like; location is
          the heaviest-weighted part of your Match %.
        </p>

        {areas.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {areas.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setAreas((prev) => prev.filter((a) => a !== id))}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-blue-tint px-3.5 py-1.5 text-sm font-medium text-blue-text hover:bg-blue-text hover:text-white"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {areaLabel(id)}
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative mt-4 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-soft" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a town or area, e.g. Largs, Stockbridge, Melrose"
            className="min-h-11 w-full rounded-full border border-hairline bg-white pl-11 pr-4 text-base focus:border-blue-deep"
          />
          {results.length > 0 && (
            <ul className="popover-in absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-hairline bg-white p-1.5 shadow-[var(--shadow-card-hover)]">
              {results.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => addArea(a.id)}
                    className="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm hover:bg-blue-tint"
                  >
                    <span className="font-medium">{a.place}</span>{" "}
                    <span className="text-charcoal-soft">
                      · {a.councilName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">
            Or browse by region
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  setBrowseRegion(browseRegion === r.id ? null : r.id)
                }
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors",
                  browseRegion === r.id
                    ? "bg-charcoal text-white ring-charcoal"
                    : "ring-hairline hover:bg-soft",
                )}
              >
                {r.name}
              </button>
            ))}
          </div>
          {browseRegion && (
            <div className="mt-3 space-y-3 rounded-2xl bg-soft p-4">
              {REGIONS.filter((r) => r.id === browseRegion).map((r) =>
                r.councils.map((c) => (
                  <div key={c.id}>
                    <p className="text-xs font-bold text-charcoal-soft">
                      {c.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {c.places.map((p) => {
                        const id = areaId(c.id, p);
                        const active = areas.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              active
                                ? setAreas((prev) => prev.filter((a) => a !== id))
                                : addArea(id)
                            }
                            className={cn(
                              "cursor-pointer rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                              active
                                ? "bg-blue-text text-white ring-blue-text"
                                : "bg-white ring-hairline hover:ring-blue-deep",
                            )}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )),
              )}
            </div>
          )}
        </div>
      </section>

      {/* Budget */}
      <section>
        <h2 className="text-xl">What kind of home are you looking for?</h2>
        <p className="mt-1 max-w-xl text-sm text-charcoal-soft">
          Pick the closest match, or more than one if you&apos;re torn. This
          helps us match you to the right properties before they&apos;re
          listed, and it&apos;s the image that appears on your anonymous
          Quiet Seeker card. You can change it any time.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PICKER_TYPES.map((t) => {
            const on = pickedTypes.includes(t.key);
            const first = pickedTypes[0] === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => togglePickedType(t.key)}
                className={cn(
                  "relative min-h-11 cursor-pointer rounded-xl border-[1.5px] p-3 pb-2.5 text-center transition-[background-color,border-color,box-shadow,transform] duration-[var(--duration-press)] ease-out active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-orange/50",
                  on
                    ? "border-orange-deep bg-orange-tint shadow-[0_0_0_3px_rgb(243_124_36/0.14)]"
                    : "border-hairline bg-white hover:border-charcoal/30 hover:bg-soft/60",
                )}
              >
                {on && (
                  <span className="absolute -right-2 -top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-orange-deep text-white">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">selected</span>
                  </span>
                )}
                <PropertyTypeIcon
                  type={t.key}
                  size={52}
                  className="mx-auto text-charcoal"
                />
                <span className="mt-2 block text-[11.5px] font-bold leading-tight">
                  {t.label}
                </span>
                {first && pickedTypes.length > 1 && (
                  <span className="mt-0.5 block text-[9.5px] font-semibold uppercase tracking-wide text-orange-deep">
                    Card icon
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-charcoal-soft" aria-live="polite">
          {pickedTypes.length === 0
            ? "Skip this and your card shows the “open to any property type” mark."
            : `Selected: ${pickedTypes
                .map(
                  (k) => SEEKER_PROPERTY_TYPES.find((t) => t.key === k)?.label,
                )
                .join(", ")}${pickedTypes.length > 1 ? " (the first one is your card icon)" : ""}.`}
        </p>
      </section>

      <section>
        <h2 className="text-xl">Your budget range</h2>
        <p className="mt-1 text-sm text-charcoal-soft">
          From £50,000 to £5,000,000. Drag both handles.
        </p>
        <div className="mt-5 max-w-xl">
          <p className="font-display text-2xl font-bold text-orange-deep">
            {gbp(budgetMin)} <span className="text-charcoal-soft">–</span>{" "}
            {gbp(budgetMax)}
          </p>
          <div className="relative mt-4 h-11">
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-hairline" />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-orange"
              style={{
                left: `${Math.min(tMin, tMax)}%`,
                right: `${100 - Math.max(tMin, tMax)}%`,
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={tMin}
              onChange={(e) => setTMin(Number(e.target.value))}
              aria-label="Minimum budget"
              className="dual-range absolute inset-0 w-full"
            />
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={tMax}
              onChange={(e) => setTMax(Number(e.target.value))}
              aria-label="Maximum budget"
              className="dual-range absolute inset-0 w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-charcoal-soft">
            <span>£50k</span>
            <span>£250k</span>
            <span>£1m</span>
            <span>£5m</span>
          </div>
        </div>
      </section>

      {/* Needs */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="minBeds" className="block text-sm font-semibold">
            Bedrooms (minimum)
          </label>
          <select
            id="minBeds"
            name="minBeds"
            defaultValue={brief?.minBeds ?? 2}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline bg-white px-4 text-base"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="minBaths" className="block text-sm font-semibold">
            Toilets / bathrooms (minimum)
          </label>
          <select
            id="minBaths"
            name="minBaths"
            defaultValue={brief?.minBaths ?? 1}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline bg-white px-4 text-base"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-sm font-semibold">Garden</p>
          <div className="mt-1.5 flex gap-2">
            {(
              [
                ["no-preference", "No preference"],
                ["nice-to-have", "Nice to have"],
                ["must-have", "Must-have"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex-1 cursor-pointer rounded-xl border border-hairline px-3 py-2.5 text-center text-sm font-medium has-[:checked]:border-green-deep has-[:checked]:bg-green-tint"
              >
                <input
                  type="radio"
                  name="garden"
                  value={value}
                  defaultChecked={(brief?.garden ?? "no-preference") === value}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="position" className="block text-sm font-semibold">
            Your buying position
          </label>
          <select
            id="position"
            name="position"
            defaultValue={brief?.position ?? "cash-nothing-to-sell"}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline bg-white px-4 text-base"
          >
            {BUYING_POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Types + features */}
      <section>
        <p className="text-sm font-semibold">
          Property types{" "}
          <span className="font-normal text-charcoal-soft">
            (leave empty for “open to anything”)
          </span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <label
              key={t.value}
              className="inline-flex min-h-8 cursor-pointer items-center rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ring-hairline transition-[background-color,box-shadow,transform] duration-[var(--duration-press)] ease-out active:scale-[0.97] pointer-coarse:min-h-11 motion-reduce:active:scale-100 has-[:checked]:bg-charcoal has-[:checked]:text-white has-[:checked]:ring-charcoal"
            >
              <input
                type="checkbox"
                name="types"
                value={t.value}
                defaultChecked={brief?.types.includes(t.value)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
        <p className="mt-6 text-sm font-semibold">
          The extras that matter to you
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEATURE_TAGS.map((f) => (
            <label
              key={f.value}
              className="inline-flex min-h-8 cursor-pointer items-center rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ring-hairline transition-[background-color,box-shadow,transform] duration-[var(--duration-press)] ease-out active:scale-[0.97] pointer-coarse:min-h-11 motion-reduce:active:scale-100 has-[:checked]:bg-orange-tint has-[:checked]:text-orange-deep has-[:checked]:ring-orange"
            >
              <input
                type="checkbox"
                name="features"
                value={f.value}
                defaultChecked={brief?.features.includes(f.value)}
                className="sr-only"
              />
              {f.label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <label htmlFor="notes" className="block text-sm font-semibold">
          Anything else? <span className="font-normal text-charcoal-soft">(optional, private)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={brief?.notes}
          placeholder="South-facing garden, near a good primary school, room for the kayaks…"
          className="mt-1.5 w-full rounded-xl border border-hairline px-4 py-3 text-base focus:border-blue-deep"
        />
      </section>

      {/* The public, anonymised half: what sellers see on /seekers */}
      <section className="rounded-2xl bg-blue-tint/60 p-5 ring-1 ring-blue-deep/15">
        <h2 className="text-base font-bold">Your public profile</h2>
        <p className="mt-1 text-sm text-charcoal-soft">
          Shown to everyone on the live Quiet Seekers list, anonymised and never
          your name. A good story helps the right seller recognise their buyer.
        </p>
        <label htmlFor="headline" className="mt-4 block text-sm font-semibold">
          Profile headline
        </label>
        <input
          id="headline"
          name="headline"
          maxLength={60}
          defaultValue={brief?.headline}
          placeholder="e.g. Golf-mad family chasing the coast"
          className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base focus:border-blue-deep"
        />
        <label htmlFor="story" className="mt-4 block text-sm font-semibold">
          Your story
        </label>
        <textarea
          id="story"
          name="story"
          rows={4}
          maxLength={500}
          defaultValue={brief?.story}
          placeholder="Who you are (no names needed), why you're moving, and how ready you are. Sellers read these."
          className="mt-1.5 w-full rounded-xl border border-hairline px-4 py-3 text-base focus:border-blue-deep"
        />
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-hairline pt-6">
        <SubmitButton
          disabled={areas.length === 0}
          pendingLabel="Saving your brief…"
        >
          {brief?.contract ? "Save my brief" : "Save & continue to agreement"}
        </SubmitButton>
        {areas.length === 0 && (
          <p className="text-sm text-charcoal-soft">
            Pick at least one area to continue.
          </p>
        )}
      </div>
    </form>
  );
}
