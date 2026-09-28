// Anonymised Quiet Seeker card — what a seller sees on their matches list.
// No names, no contact details: position, budget, areas, and the Match %.

import { UserRound, Wallet, MapPin } from "lucide-react";
import { areaShortLabel } from "@/lib/areas";
import { formatBudget } from "@/lib/format";
import type { SeekerMatch } from "@/lib/matches";
import { MatchRing } from "./match-ring";

export function SeekerMatchCard({ match }: { match: SeekerMatch }) {
  return (
    // card-lift to match every sibling card. Without it this was the one card
    // that stayed dead on hover, and it renders in the same dashboard scroll as
    // a grid of HomeCards that do lift (dashboard/page.tsx:262 then :309).
    <article className="card-lift rounded-[var(--radius-lg)] bg-paper p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-tint p-2.5 text-blue-deep">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Quiet Seeker</p>
            <p className="text-xs text-charcoal-soft">{match.positionLabel}</p>
          </div>
        </div>
        <MatchRing pct={match.result.pct} size="md" />
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-charcoal-soft">
          <Wallet className="h-4 w-4 shrink-0" />
          <dd>{formatBudget(match.budgetMin, match.budgetMax)}</dd>
        </div>
        <div className="flex items-start gap-2 text-charcoal-soft">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <dd>{match.areas.map(areaShortLabel).join(" · ") || "Anywhere in Scotland"}</dd>
        </div>
      </dl>
      <ul className="mt-4 space-y-1 border-t border-hairline pt-3 text-xs text-charcoal-soft">
        {match.result.components.slice(0, 3).map((c) => (
          <li key={c.key} className="flex justify-between gap-3">
            <span>{c.label}</span>
            <span className="font-medium text-charcoal">{c.detail}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
