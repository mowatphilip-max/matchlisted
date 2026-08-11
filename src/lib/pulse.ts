// Read-only "pulse of the Matchlist" helpers for the landing page.
// IMPORTANT: nothing here may mutate the store — in particular, never call
// await collectFreshHotMatches() from the landing page (it records seen-matches
// and pushes notifications, which would consume the dashboard celebration).

import { activeBriefs, liveHomes, matchWeights } from "./db";
import { areaShortLabel } from "./areas";
import { formatPrice } from "./format";
import { scoreMatch } from "./match";

export interface AreaStat {
  count: number;
  budgetMin: number;
  budgetMax: number;
}

export interface AreaSeekerStats {
  byPlace: Record<string, AreaStat>;
  byCouncil: Record<string, AreaStat>;
}

/**
 * Per-area and per-council counts of live (contract-signed) Quiet Seekers,
 * with the span of their budgets. A brief credits each of its areas once,
 * and each council once. Compact enough to ship to a client island as JSON.
 */
export async function areaSeekerStats(): Promise<AreaSeekerStats> {
  const byPlace: Record<string, AreaStat> = {};
  const byCouncil: Record<string, AreaStat> = {};

  const credit = (bucket: Record<string, AreaStat>, key: string, min: number, max: number) => {
    const s = bucket[key];
    if (s) {
      s.count += 1;
      s.budgetMin = Math.min(s.budgetMin, min);
      s.budgetMax = Math.max(s.budgetMax, max);
    } else {
      bucket[key] = { count: 1, budgetMin: min, budgetMax: max };
    }
  };

  for (const brief of await activeBriefs()) {
    const councils = new Set<string>();
    for (const areaId of brief.areas) {
      credit(byPlace, areaId, brief.budgetMin, brief.budgetMax);
      councils.add(areaId.split("/")[0]);
    }
    for (const councilId of councils) {
      credit(byCouncil, councilId, brief.budgetMin, brief.budgetMax);
    }
  }

  return { byPlace, byCouncil };
}

export interface PulseEvent {
  text: string;
  href?: string;
}

/**
 * A short anonymised feed of real store activity for the landing-page
 * ticker: newest seekers, hottest live pairings, freshest Hush Homes.
 */
export async function matchlistPulse(): Promise<PulseEvent[]> {
  const briefs = await activeBriefs();
  const homes = await liveHomes();
  const weights = await matchWeights();

  const newestSeekers: PulseEvent[] = [...briefs]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)
    .map((b) => ({
      text: `${b.publicRef} joined · “${b.headline}” · up to ${formatPrice(b.budgetMax)}`,
      href: `/seekers/${b.publicRef}`,
    }));

  // Hottest current pairings. Sample data is ~10 × ~11; cap defensively.
  const pairings: { pct: number; area: string }[] = [];
  for (const home of homes.slice(0, 20)) {
    for (const brief of briefs.slice(0, 30)) {
      if (brief.userId === home.sellerId) continue; // never self-match
      const { pct } = scoreMatch(home, brief, weights);
      if (pct >= 90) pairings.push({ pct, area: areaShortLabel(home.areaId) });
    }
  }
  const hotPairings: PulseEvent[] = pairings
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
    .map((p) => ({
      text: `A ${p.pct}% match just lit up in ${p.area}`,
      href: "/join",
    }));

  const newestHomes: PulseEvent[] = [...homes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map((h) => ({
      text: `New Hush Home quietly live in ${areaShortLabel(h.areaId)} · ${formatPrice(h.price)}`,
      href: "/join",
    }));

  // Interleave the three streams so the ticker varies its rhythm.
  const streams = [newestSeekers, hotPairings, newestHomes];
  const events: PulseEvent[] = [];
  for (let i = 0; i < 4; i++) {
    for (const s of streams) {
      if (s[i]) events.push(s[i]);
    }
  }
  return events;
}
