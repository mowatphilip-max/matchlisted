"use client";

// Self-build Hush Home listing form. The address stays private — only the
// area is public. Photos/floor plans are optional and can come later.

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { areaLabel, searchAreas } from "@/lib/areas";
import { saveHomeListing } from "@/lib/actions";
import {
  FEATURE_TAGS,
  PROPERTY_TYPES,
  type HushHome,
} from "@/lib/types";
import { Button } from "./ui/button";

export function HomeForm({ home }: { home: HushHome | null }) {
  const [areaId, setAreaId] = useState(home?.areaId ?? "");
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchAreas(query), [query]);

  return (
    <form action={saveHomeListing} className="space-y-8">
      {home && <input type="hidden" name="homeId" value={home.id} />}
      <input type="hidden" name="areaId" value={areaId} />

      <div>
        <label htmlFor="headline" className="block text-sm font-semibold">
          Profile headline
        </label>
        <p className="text-xs text-charcoal-soft">
          Like a dating profile: lead with what makes it lovable.
        </p>
        <input
          id="headline"
          name="headline"
          required
          defaultValue={home?.headline}
          placeholder="Sunny Victorian terrace two streets from the sea"
          className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-sm outline-none focus:border-orange-deep"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold">Area</label>
          <p className="text-xs text-charcoal-soft">
            This is what seekers see. The street address stays private.
          </p>
          {areaId ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-orange-tint px-4 py-2 text-sm font-medium text-orange-deep">
              <MapPin className="h-4 w-4" />
              {areaLabel(areaId)}
              <button
                type="button"
                onClick={() => setAreaId("")}
                className="cursor-pointer font-bold hover:underline"
              >
                change
              </button>
            </p>
          ) : (
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-soft" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your town or area"
                className="min-h-11 w-full rounded-full border border-hairline bg-white pl-11 pr-4 text-sm outline-none focus:border-orange-deep"
              />
              {results.length > 0 && (
                <ul className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-hairline bg-white p-1.5 shadow-[var(--shadow-card-hover)]">
                  {results.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setAreaId(a.id);
                          setQuery("");
                        }}
                        className="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm hover:bg-orange-tint"
                      >
                        <span className="font-medium">{a.place}</span>{" "}
                        <span className="text-charcoal-soft">· {a.councilName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="addressLine" className="block text-sm font-semibold">
            Street address <span className="font-normal text-charcoal-soft">(private)</span>
          </label>
          <input
            id="addressLine"
            name="addressLine"
            required
            defaultValue={home?.addressLine}
            placeholder="14 Marine Terrace"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-sm outline-none focus:border-orange-deep"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="price" className="block text-sm font-semibold">
            Your estimate of your home&apos;s value (£)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min={50000}
            step={1000}
            defaultValue={home?.price}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-sm outline-none focus:border-orange-deep"
          />
          <p className="mt-1 text-xs text-charcoal-soft">
            Your honest best guess. It prices your Home Report and can be
            corrected once the report is done.
          </p>
        </div>
        <div>
          <label htmlFor="beds" className="block text-sm font-semibold">
            Bedrooms
          </label>
          <select
            id="beds"
            name="beds"
            defaultValue={home?.beds ?? 3}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline bg-white px-4 text-sm"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="baths" className="block text-sm font-semibold">
            Toilets / bathrooms
          </label>
          <select
            id="baths"
            name="baths"
            defaultValue={home?.baths ?? 1}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline bg-white px-4 text-sm"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-semibold">
            Property type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={home?.type ?? "detached"}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline bg-white px-4 text-sm"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="flex w-fit cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            name="garden"
            defaultChecked={home?.garden}
            className="h-4 w-4 accent-[var(--color-green-deep)]"
          />
          This home has a garden
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold">Features</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEATURE_TAGS.map((f) => (
            <label
              key={f.value}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ring-hairline transition-colors has-[:checked]:bg-charcoal has-[:checked]:text-white has-[:checked]:ring-charcoal"
            >
              <input
                type="checkbox"
                name="features"
                value={f.value}
                defaultChecked={home?.features.includes(f.value)}
                className="sr-only"
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          required
          defaultValue={home?.description}
          placeholder="Tell its story: the light in the kitchen at breakfast, the walk to the station, the neighbours you'll miss…"
          className="mt-1.5 w-full rounded-xl border border-hairline px-4 py-3 text-sm outline-none focus:border-orange-deep"
        />
      </div>

      <div className="rounded-2xl bg-soft p-4 text-sm text-charcoal-soft">
        Photography and floor plans can be added any time from your home&apos;s
        page. They&apos;re optional, though profiles with photos get more
        Introductions.
      </div>

      {/* Preview listings are gone (BUILD-BRIEF.md §3): nothing may be shown
          to seekers, hazed or otherwise, before the Home Report is verified. */}
      <div className="rounded-2xl bg-blue-tint/60 p-4 text-sm text-charcoal-soft ring-1 ring-blue-deep/15">
        Your home stays completely private while you build it. It becomes
        visible to registered Quiet Seekers only once its Home Report is
        verified and the listing is approved.
      </div>

      <div className="border-t border-hairline pt-6">
        <Button type="submit" variant="seller" disabled={!areaId}>
          {home ? "Save changes" : "Save my Hush Home"}
        </Button>
        {!areaId && (
          <p className="mt-2 text-sm text-charcoal-soft">
            Choose your area to continue.
          </p>
        )}
      </div>
    </form>
  );
}
