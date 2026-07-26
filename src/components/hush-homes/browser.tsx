"use client";

// The browsable Hush Homes list with a filter bar.
//
// Two viewing modes, decided SERVER-side (the page only ships the fields
// each viewer is allowed to see):
//   - unregistered: limited info (area, price, beds, type), photos blurred,
//     every card sells registration
//   - registered Quiet Seeker: full cards linking to the home profile, with
//     a Home Report download on each listing

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  FileDown,
  Lock,
  MapPin,
  Search,
  Trees,
} from "lucide-react";
import { getArea } from "@/lib/areas";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/types";
import { PropertyImage } from "@/components/property-image";
import { cn } from "@/lib/utils";

/** What the server ships per home — full fields only for registered viewers. */
export interface BrowserHome {
  id: string;
  areaId: string;
  price: number;
  beds: number;
  type: PropertyType;
  status: "live" | "under-offer";
  photo: string | null;
  // Registered-only fields:
  headline?: string;
  baths?: number;
  garden?: boolean;
  reportReady?: boolean;
}

const MAX_PRICES = [500000, 750000, 1000000, 1500000, 3000000] as const;

export function HushHomesBrowser({
  homes,
  registered,
}: {
  homes: BrowserHome[];
  registered: boolean;
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [maxPrice, setMaxPrice] = useState(0); // 0 = any
  const [minBeds, setMinBeds] = useState(0);
  const [type, setType] = useState("all");

  const regions = useMemo(
    () =>
      [...new Set(homes.map((h) => getArea(h.areaId)?.regionName ?? ""))]
        .filter(Boolean)
        .sort(),
    [homes],
  );

  const shown = homes.filter((h) => {
    const area = getArea(h.areaId);
    if (region !== "all" && area?.regionName !== region) return false;
    if (maxPrice > 0 && h.price > maxPrice) return false;
    if (minBeds > 0 && h.beds < minBeds) return false;
    if (type !== "all" && h.type !== type) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const hay = [
        area?.place,
        area?.councilName,
        area?.regionName,
        h.headline ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const selectCls =
    "min-h-11 cursor-pointer rounded-xl border border-hairline bg-white px-3 text-sm font-medium outline-none focus:border-orange-deep";

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius-lg)] bg-paper p-4 shadow-[var(--shadow-card)] ring-1 ring-hairline">
        <div className="flex min-w-52 flex-1 items-center gap-2 rounded-xl border border-hairline px-3 focus-within:border-orange-deep">
          <Search className="h-4 w-4 shrink-0 text-charcoal-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search area or town…"
            aria-label="Search homes by area"
            className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <select aria-label="Region" value={region} onChange={(e) => setRegion(e.target.value)} className={selectCls}>
          <option value="all">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select aria-label="Maximum price" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className={selectCls}>
          <option value={0}>Any price</option>
          {MAX_PRICES.map((p) => (
            <option key={p} value={p}>Up to {formatPrice(p)}</option>
          ))}
        </select>
        <select aria-label="Minimum bedrooms" value={minBeds} onChange={(e) => setMinBeds(Number(e.target.value))} className={selectCls}>
          <option value={0}>Any beds</option>
          {[2, 3, 4, 5].map((b) => (
            <option key={b} value={b}>{b}+ beds</option>
          ))}
        </select>
        <select aria-label="Property type" value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
          <option value="all">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-sm text-charcoal-soft">
        {shown.length} of {homes.length} Hush Home{homes.length === 1 ? "" : "s"}
        {registered ? "" : " — anonymised until you register"}
      </p>

      {/* Grid */}
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((h) =>
          registered ? (
            <FullCard key={h.id} home={h} />
          ) : (
            <LockedCard key={h.id} home={h} />
          ),
        )}
      </div>

      {shown.length === 0 && (
        <p className="mt-6 rounded-2xl bg-soft p-6 text-sm text-charcoal-soft">
          Nothing matches those filters — loosen one and try again. New Hush
          Homes arrive quietly all the time.
        </p>
      )}
    </div>
  );
}

function typeLabel(t: PropertyType): string {
  return PROPERTY_TYPES.find((p) => p.value === t)?.label ?? t;
}

/** Full dating-profile card for registered Quiet Seekers. */
function FullCard({ home }: { home: BrowserHome }) {
  const area = getArea(home.areaId);
  return (
    <article className="group card-lift relative overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline">
      <Link href={`/homes/${home.id}`} className="block focus-visible:outline-none">
        <div className="relative overflow-hidden rounded-t-[var(--radius-lg)]">
          <PropertyImage
            src={home.photo}
            alt={home.headline ?? "Hush Home"}
            placeholderKey={home.id}
            className="aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
          {home.status === "under-offer" && (
            <span className="absolute left-3 top-3 rounded-full bg-charcoal/85 px-3 py-1 text-xs font-semibold text-white">
              Under offer
            </span>
          )}
        </div>
        <div className="p-5 pt-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-charcoal-soft">
            <MapPin className="h-3.5 w-3.5 text-blue-deep" />
            {area ? `${area.place}, ${area.councilName}` : ""}
          </p>
          <h3 className="mt-1.5 text-base leading-snug">{home.headline}</h3>
          <p className="mt-2 font-display text-lg font-bold text-charcoal">
            {formatPrice(home.price)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-soft">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {home.beds} beds
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {home.baths} baths
            </span>
            {home.garden && (
              <span className="inline-flex items-center gap-1">
                <Trees className="h-3.5 w-3.5" /> Garden
              </span>
            )}
            <span>{typeLabel(home.type)}</span>
          </div>
        </div>
      </Link>
      {home.reportReady && (
        <div className="border-t border-hairline px-5 py-3">
          <a
            href={`/homes/${home.id}/report`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-deep hover:underline"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download the Home Report
          </a>
        </div>
      )}
    </article>
  );
}

/** Limited, blurred teaser for everyone else — every pixel sells registering. */
function LockedCard({ home }: { home: BrowserHome }) {
  const area = getArea(home.areaId);
  return (
    <article className="group card-lift relative overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline">
      <Link href="/join" className="block focus-visible:outline-none">
        <div className="relative overflow-hidden rounded-t-[var(--radius-lg)]">
          {/* Blur whatever is behind — a real photo or the placeholder art. */}
          <div className="blur-md" aria-hidden="true">
            <PropertyImage
              src={home.photo}
              alt=""
              placeholderKey={home.id}
              className="aspect-[4/3] w-full scale-110"
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-charcoal/35 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur-sm">
              <Lock className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-charcoal/60 px-3 py-1 text-xs font-semibold">
              Register free to unlock
            </span>
          </div>
          {home.status === "under-offer" && (
            <span className="absolute left-3 top-3 rounded-full bg-charcoal/85 px-3 py-1 text-xs font-semibold text-white">
              Under offer
            </span>
          )}
        </div>
        <div className="p-5 pt-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-charcoal-soft">
            <MapPin className="h-3.5 w-3.5 text-blue-deep" />
            {area ? `${area.place}, ${area.councilName}` : ""}
          </p>
          <h3 className="mt-1.5 text-base leading-snug text-charcoal-soft">
            A quietly listed {typeLabel(home.type).toLowerCase()}
          </h3>
          <p className="mt-2 font-display text-lg font-bold text-charcoal">
            {formatPrice(home.price)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-soft">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {home.beds} beds
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-blue-deep">
              <Lock className="h-3 w-3" /> Full details for registered Quiet
              Seekers
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
