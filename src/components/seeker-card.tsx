// Public, anonymised Quiet Seeker card — the buyer-side twin of HomeCard.
// Anyone can browse these: a story and a criteria list, never an identity.

import Link from "next/link";
import { BedDouble, Bath, MapPin, Trees, UserRound, Wallet } from "lucide-react";
import { areaShortLabel } from "@/lib/areas";
import { formatBudget } from "@/lib/format";
import {
  BUYING_POSITIONS,
  PROPERTY_TYPES,
  type SeekerBrief,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function positionLabel(brief: SeekerBrief): string {
  return (
    BUYING_POSITIONS.find((p) => p.value === brief.position)?.label ??
    brief.position
  );
}

export function SeekerCard({
  brief,
  className,
}: {
  brief: SeekerBrief;
  className?: string;
}) {
  const types =
    brief.types.length === 0
      ? "Open to any type"
      : brief.types
          .map((t) => PROPERTY_TYPES.find((p) => p.value === t)?.label ?? t)
          .slice(0, 2)
          .join(" · ") + (brief.types.length > 2 ? " +" : "");

  return (
    <article
      className={cn(
        "group card-lift relative overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-orange-deep",
        className,
      )}
    >
      <Link
        href={`/seekers/${brief.publicRef}`}
        className="block focus-visible:outline-none"
      >
        {/* Anonymous "photo" slot — same aspect as a home photo, no face. */}
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-t-[var(--radius-lg)] bg-gradient-to-br from-blue-tint via-soft to-blue-tint">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 text-blue-deep shadow-sm ring-1 ring-hairline transition-transform duration-[var(--duration-menu)] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <UserRound className="h-12 w-12" />
          </span>
          <span className="absolute left-3 top-3 rounded-full bg-blue-text px-3 py-1 text-xs font-semibold text-white">
            Quiet Seeker · {brief.publicRef}
          </span>
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-charcoal shadow-sm">
            {positionLabel(brief)}
          </span>
        </div>
        <div className="p-5 pt-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-charcoal-soft">
            <MapPin className="h-3.5 w-3.5 text-blue-deep" />
            {brief.areas.map(areaShortLabel).join(" · ") ||
              "Anywhere in Scotland"}
          </p>
          <h3 className="mt-1.5 text-base leading-snug">{brief.headline}</h3>
          <p className="mt-2 flex items-center gap-1.5 font-display text-lg font-bold text-charcoal">
            <Wallet className="h-4 w-4 text-blue-deep" />
            {brief.budgetMax > 0
              ? formatBudget(brief.budgetMin, brief.budgetMax)
              : "Substantial budget · undisclosed"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-soft">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {brief.minBeds}+ beds
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {brief.minBaths}+ baths
            </span>
            {brief.garden === "must-have" && (
              <span className="inline-flex items-center gap-1">
                <Trees className="h-3.5 w-3.5" /> Garden
              </span>
            )}
            <span>{types}</span>
          </div>
          <p className="mt-3 line-clamp-2 border-t border-hairline pt-3 text-xs leading-relaxed text-charcoal-soft">
            &ldquo;{brief.story}&rdquo;
          </p>
        </div>
      </Link>
    </article>
  );
}
