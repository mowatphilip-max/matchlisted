// Dating-profile style card for a Hush Home. Worn by the matches grid, the
// dashboard and (in teaser form) the marketing homepage.

import Link from "next/link";
import { BedDouble, Bath, Trees, MapPin } from "lucide-react";
import { areaLabel } from "@/lib/areas";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPES, type HushHome } from "@/lib/types";
import { MatchRing } from "./match-ring";
import { PropertyImage } from "./property-image";
import { cn } from "@/lib/utils";

export function HomeCard({
  home,
  pct,
  matchDetail,
  href,
  heartSlot,
  className,
}: {
  home: HushHome;
  pct?: number;
  matchDetail?: string;
  href?: string;
  heartSlot?: React.ReactNode;
  className?: string;
}) {
  const typeLabel =
    PROPERTY_TYPES.find((t) => t.value === home.type)?.label ?? home.type;
  const body = (
    <>
      <div className="relative">
        <div className="overflow-hidden rounded-t-[var(--radius-lg)]">
          <PropertyImage
            src={home.photos[0] ?? null}
            alt={home.headline}
            placeholderKey={home.id}
            className="aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>
        {pct !== undefined && (
          <div className="absolute -bottom-6 right-4">
            <MatchRing pct={pct} size="md" className="drop-shadow-md" />
          </div>
        )}
        {home.status === "under-offer" && (
          <span className="absolute left-3 top-3 rounded-full bg-charcoal/85 px-3 py-1 text-xs font-semibold text-white">
            Under offer
          </span>
        )}
      </div>
      <div className="p-5 pt-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-charcoal-soft">
          <MapPin className="h-3.5 w-3.5 text-blue-deep" />
          {areaLabel(home.areaId)}
        </p>
        <h3 className="mt-1.5 pr-10 text-base leading-snug">{home.headline}</h3>
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
          <span>{typeLabel}</span>
        </div>
        {matchDetail && (
          <p className="mt-3 border-t border-hairline pt-3 text-xs text-charcoal-soft">
            {matchDetail}
          </p>
        )}
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group card-lift relative overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline",
        className,
      )}
    >
      {href ? (
        <Link href={href} className="block focus-visible:outline-none">
          {body}
        </Link>
      ) : (
        body
      )}
      {heartSlot && <div className="absolute right-3 top-3">{heartSlot}</div>}
    </article>
  );
}
