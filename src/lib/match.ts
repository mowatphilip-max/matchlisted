// The Matchlist engine: scores every Hush Home against every Quiet Seeker
// brief as a 0–100 Match %.
//
// Weights (agreed 17 Jul 2026, tunable from the admin back-office):
//   Location 35 · Price 25 · Bedrooms 12 · Property type 10 · Bathrooms 8
//   · Garden 6 · Other stated preferences 4
//
// Two factors also act as gates, because a great house in the wrong place or
// far past budget is not a match, whatever the component sum says:
//   - Location miss (different region entirely) caps the total at 15%.
//   - Price more than 10% over budget max caps the total at 25%.

import { getArea } from "./areas";
import type { HushHome, MatchWeights, SeekerBrief } from "./types";

export const DEFAULT_WEIGHTS: MatchWeights = {
  location: 35,
  price: 25,
  beds: 12,
  type: 10,
  baths: 8,
  garden: 6,
  other: 4,
};

export interface MatchComponent {
  key: keyof MatchWeights;
  label: string;
  /** 0–1 how well this component matched. */
  score: number;
  weight: number;
  detail: string;
}

export interface MatchResult {
  pct: number; // 0–100, rounded
  components: MatchComponent[];
  gated: string | null; // human-readable reason a cap applied, if any
}

function locationScore(
  home: HushHome,
  brief: SeekerBrief,
): { score: number; detail: string } {
  const homeArea = getArea(home.areaId);
  if (!homeArea) return { score: 0, detail: "Unknown area" };
  if (brief.areas.length === 0)
    return { score: 1, detail: "Open to anywhere in Scotland" };
  if (brief.areas.includes(home.areaId))
    return { score: 1, detail: `${homeArea.place} is on their list` };

  const briefAreas = brief.areas
    .map(getArea)
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  if (briefAreas.some((a) => a.councilId === homeArea.councilId))
    return {
      score: 0.7,
      detail: `Same council area (${homeArea.councilName})`,
    };
  if (briefAreas.some((a) => a.regionId === homeArea.regionId))
    return { score: 0.35, detail: `Same region (${homeArea.regionName})` };
  return { score: 0, detail: "Outside their chosen areas" };
}

function priceScore(
  home: HushHome,
  brief: SeekerBrief,
): { score: number; detail: string; farOver: boolean } {
  const { budgetMin, budgetMax } = brief;
  if (home.price >= budgetMin && home.price <= budgetMax)
    return { score: 1, detail: "Comfortably inside budget", farOver: false };
  if (home.price < budgetMin) {
    // Cheaper than the stated floor — rarely a deal-breaker.
    const under = (budgetMin - home.price) / budgetMin;
    return under <= 0.15
      ? { score: 0.85, detail: "A little under budget", farOver: false }
      : { score: 0.6, detail: "Well under their budget range", farOver: false };
  }
  const over = (home.price - budgetMax) / budgetMax;
  if (over <= 0.05)
    return { score: 0.6, detail: "Up to 5% over budget", farOver: false };
  if (over <= 0.1)
    return { score: 0.3, detail: "5–10% over budget", farOver: false };
  return { score: 0, detail: "More than 10% over budget", farOver: true };
}

function stepScore(actual: number, min: number): number {
  if (actual >= min) return 1;
  if (actual === min - 1) return 0.4;
  return 0;
}

export function scoreMatch(
  home: HushHome,
  brief: SeekerBrief,
  weights: MatchWeights = DEFAULT_WEIGHTS,
): MatchResult {
  const location = locationScore(home, brief);
  const price = priceScore(home, brief);

  const beds = stepScore(home.beds, brief.minBeds);
  const baths = home.baths >= brief.minBaths ? 1 : home.baths === brief.minBaths - 1 ? 0.5 : 0;

  const typeMatch =
    brief.types.length === 0 ? 1 : brief.types.includes(home.type) ? 1 : 0.2;

  let garden = 1;
  let gardenDetail = "No garden preference";
  if (brief.garden === "must-have") {
    garden = home.garden ? 1 : 0;
    gardenDetail = home.garden ? "Has the garden they need" : "No garden, and it's a must-have";
  } else if (brief.garden === "nice-to-have") {
    garden = home.garden ? 1 : 0.5;
    gardenDetail = home.garden ? "Garden (nice to have)" : "No garden (nice-to-have)";
  }

  let other = 1;
  let otherDetail = "No extra preferences stated";
  if (brief.features.length > 0) {
    const hits = brief.features.filter((f) => home.features.includes(f)).length;
    other = hits / brief.features.length;
    otherDetail = `${hits} of ${brief.features.length} wished-for features`;
  }

  const components: MatchComponent[] = [
    {
      key: "location",
      label: "Location",
      score: location.score,
      weight: weights.location,
      detail: location.detail,
    },
    {
      key: "price",
      label: "Price vs budget",
      score: price.score,
      weight: weights.price,
      detail: price.detail,
    },
    {
      key: "beds",
      label: "Bedrooms",
      score: beds,
      weight: weights.beds,
      detail:
        home.beds >= brief.minBeds
          ? `${home.beds} beds (wanted ${brief.minBeds}+)`
          : `${home.beds} beds, but they asked for ${brief.minBeds}+`,
    },
    {
      key: "type",
      label: "Property type",
      score: typeMatch,
      weight: weights.type,
      detail:
        brief.types.length === 0
          ? "Open to any type"
          : typeMatch === 1
            ? "Their kind of home"
            : "Not a preferred type",
    },
    {
      key: "baths",
      label: "Bathrooms",
      score: baths,
      weight: weights.baths,
      detail:
        home.baths >= brief.minBaths
          ? `${home.baths} baths (wanted ${brief.minBaths}+)`
          : `${home.baths} baths, but they asked for ${brief.minBaths}+`,
    },
    {
      key: "garden",
      label: "Garden",
      score: garden,
      weight: weights.garden,
      detail: gardenDetail,
    },
    {
      key: "other",
      label: "Extras",
      score: other,
      weight: weights.other,
      detail: otherDetail,
    },
  ];

  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  let pct =
    (components.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight) *
    100;

  // Gates: wrong place or way over money caps the whole match.
  let gated: string | null = null;
  if (location.score === 0 && brief.areas.length > 0) {
    pct = Math.min(pct, 15);
    gated = "Capped at 15%: outside their chosen areas";
  } else if (price.farOver) {
    pct = Math.min(pct, 25);
    gated = "Capped at 25%: more than 10% over budget";
  } else if (brief.garden === "must-have" && !home.garden) {
    pct = Math.min(pct, 49);
    gated = "Capped at 49%: missing a must-have garden";
  }

  return { pct: Math.round(pct), components, gated };
}

/** ≥90 = "It's a match" moment; ring colours follow the same bands. */
export const MATCH_BANDS = {
  hot: 90, // orange ring, celebration
  warm: 50, // blue ring
} as const;

export function matchBand(pct: number): "hot" | "warm" | "cool" {
  if (pct >= MATCH_BANDS.hot) return "hot";
  if (pct >= MATCH_BANDS.warm) return "warm";
  return "cool";
}

export function matchLine(pct: number): string {
  if (pct >= 95) return `${pct}% match. This could be the one.`;
  if (pct >= 90) return `${pct}% match. Well worth an Introduction.`;
  if (pct >= 75) return `${pct}% match. A strong contender.`;
  if (pct >= 50) return `${pct}% match. Worth a look.`;
  return `${pct}% match.`;
}
