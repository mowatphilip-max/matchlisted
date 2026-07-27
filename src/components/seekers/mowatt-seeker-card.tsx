// The Quiet Seeker card, Variant A: line-drawing icon in a peach tile on
// the left, big seeker number on the right, then title, tags, brief,
// readiness badges, budget meter, and a footer that only ever shows the
// vetted seal when the record says so. Every field degrades gracefully —
// a card with no badges, no budget or no brief still looks deliberate.

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import {
  PropertyTypeIcon,
  propertyTypeLabel,
} from "@/components/property-type-icon";
import {
  READINESS_LABELS,
  type MowattSeeker,
} from "@/lib/mowatt-seekers";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

function compact(value: number): string {
  return value >= 1_000_000
    ? `£${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}m`
    : `£${Math.round(value / 1000)}k`;
}

export function MowattSeekerCard({
  seeker,
  className,
}: {
  seeker: MowattSeeker;
  className?: string;
}) {
  const tags = [
    seeker.beds && `${seeker.beds} beds`,
    seeker.baths && `${seeker.baths} baths`,
    seeker.garden && "garden",
    seeker.parking && "parking",
  ].filter(Boolean) as string[];

  const badges = seeker.readiness
    .slice(0, 3)
    .map((r) => READINESS_LABELS[r]);

  const meter =
    seeker.budget && seeker.budgetRangeMin && seeker.budgetRangeMax
      ? {
          pct: Math.round(
            ((seeker.budget - seeker.budgetRangeMin) /
              (seeker.budgetRangeMax - seeker.budgetRangeMin)) *
              100,
          ),
          min: seeker.budgetRangeMin,
          max: seeker.budgetRangeMax,
        }
      : null;

  return (
    <article
      className={cn(
        "group card-lift relative flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline",
        className,
      )}
    >
      {/* Header: icon tile + big number */}
      <div className="flex items-center gap-4 px-4 pt-4">
        <div className="flex h-[88px] w-[88px] flex-none items-center justify-center rounded-[3px] bg-orange-tint text-charcoal">
          <PropertyTypeIcon
            type={seeker.propertyType}
            size={62}
            title={`Icon representing the property type this buyer is seeking: ${propertyTypeLabel(seeker.propertyType)}`}
          />
        </div>
        <div className="min-w-0">
          <p className="flex items-baseline gap-1 font-display text-[38px] font-bold leading-none tracking-tight">
            <span className="text-sm font-bold tracking-wide text-orange-deep">
              #
            </span>
            <Link
              href={`/seekers/${seeker.ref}`}
              className="rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep"
            >
              {seeker.ref}
            </Link>
          </p>
          <p className="mt-2 line-clamp-2 text-[10.5px] font-medium uppercase leading-[1.45] tracking-[0.13em] text-muted">
            {seeker.towns.length > 0
              ? seeker.towns.join(" · ")
              : seeker.areasLabel || seeker.region}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15.5px] font-bold leading-snug">{seeker.title}</h3>
        {tags.length > 0 && (
          <p className="mt-2 text-[11.5px] text-charcoal-soft">
            {tags.map((t, i) => (
              <span key={t}>
                {i > 0 && <span className="px-1.5 text-hairline">|</span>}
                {t}
              </span>
            ))}
          </p>
        )}
        {seeker.copy && (
          <p className="mt-3 line-clamp-3 flex-1 text-[12.5px] italic leading-relaxed text-charcoal-soft">
            {seeker.copy}
          </p>
        )}
        {!seeker.copy && <span className="flex-1" />}

        {badges.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5 overflow-hidden">
            {badges.map((b, i) => (
              <span
                key={b}
                className={cn(
                  "whitespace-nowrap rounded-[2px] border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.07em]",
                  i === 0
                    ? "border-charcoal bg-charcoal text-white"
                    : "border-orange/30 bg-orange-tint text-orange-deep",
                )}
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Budget meter */}
        {meter ? (
          <div className="mt-3.5">
            <div className="h-[7px] overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full bg-orange"
                style={{ width: `${Math.min(Math.max(meter.pct, 6), 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-muted">
              <span>{compact(meter.min)}</span>
              <b className="text-[11px] font-bold text-orange-deep">
                {formatPrice(seeker.budget!)}
              </b>
              <span>{compact(meter.max)}</span>
            </div>
          </div>
        ) : seeker.budgetLabel ? (
          <p className="mt-3.5 text-[11px] text-muted">
            Budget:{" "}
            <b className="font-bold text-orange-deep">{seeker.budgetLabel}</b>
          </p>
        ) : null}

        {/* Footer */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-hairline pt-3">
          {seeker.vetted ? (
            <span className="inline-flex items-center gap-1.5 rounded-[2px] border-[1.5px] border-orange px-2 py-1 text-[9.5px] font-bold tracking-[0.1em] text-orange-deep">
              <BadgeCheck className="h-3 w-3" /> VETTED · ID &amp; FUNDS
            </span>
          ) : (
            <span className="text-[10.5px] font-medium text-muted">
              Mowatt Matchlist
            </span>
          )}
          <span className="text-[10.5px] text-muted">{seeker.region}</span>
        </div>
      </div>
    </article>
  );
}
