// Bridges live Mowatt sheet seekers onto the existing SeekerBrief-shaped
// components while the Quiet Seekers redesign lands. The bridge is lossy on
// purpose — it only fills what the current card/profile render.

import { searchAreas } from "./areas";
import {
  fetchMowattSeekers,
  READINESS_LABELS,
  type MowattSeeker,
  type SeekerPropertyType,
} from "./mowatt-seekers";
import type { AreaSeekerStats, AreaStat } from "./pulse";
import type { PropertyType, SeekerBrief } from "./types";

/** Sheet property types → the site's existing PropertyType chips. */
const TYPE_BRIDGE: Partial<Record<SeekerPropertyType, PropertyType>> = {
  tenement_flat: "flat",
  newbuild_apartment: "flat",
  main_door_flat: "flat",
  top_floor_flat: "flat",
  bungalow: "bungalow",
  detached: "detached",
  semi_detached: "semi-detached",
  terraced: "terraced",
  cottage: "cottage",
  country_house: "detached",
};

/** Best-effort town → area id; towns we can't place are dropped here. */
export function townToAreaId(town: string): string | null {
  const hit = searchAreas(town, 3).find(
    (a) => a.place.toLowerCase() === town.toLowerCase(),
  );
  return hit?.id ?? null;
}

/**
 * Adapt a sheet seeker to the SeekerBrief shape the current components
 * expect. `position` carries a human label directly (the card falls back
 * to the raw string when it isn't a known enum value).
 */
export function toBriefLike(s: MowattSeeker): SeekerBrief {
  const areas = s.towns
    .map(townToAreaId)
    .filter((id): id is string => id !== null);
  const position = s.readiness.includes("cash_buyer")
    ? "Cash buyer"
    : s.readiness[0]
      ? READINESS_LABELS[s.readiness[0]]
      : "Registered buyer";

  return {
    userId: `mowatt:${s.ref}`,
    publicRef: s.ref,
    headline: s.title,
    story: s.copy,
    areas,
    budgetMin: s.budgetRangeMin ?? s.budget ?? 0,
    budgetMax: s.budget ?? 0,
    minBeds: s.bedsMin ?? 1,
    minBaths: parseInt(s.baths, 10) || 1,
    garden: s.garden ? "must-have" : "no-preference",
    types: [
      ...new Set(
        s.propertyTypes
          .map((t) => TYPE_BRIDGE[t])
          .filter((t): t is PropertyType => Boolean(t)),
      ),
    ],
    features: [],
    position,
    notes: undefined,
    contract: null, // sheet seekers sign with Mowatt, not the site — never
    // claim a platform agreement for them.
    createdAt: "",
    updatedAt: "",
  };
}

export async function findMowattSeeker(
  ref: string,
): Promise<MowattSeeker | undefined> {
  const { seekers } = await fetchMowattSeekers();
  return seekers.find((s) => s.ref === ref);
}

/** AreaFinder stats built from the live sheet seekers (active only). */
export function mowattAreaStats(seekers: MowattSeeker[]): AreaSeekerStats {
  const byPlace: Record<string, AreaStat> = {};
  const byCouncil: Record<string, AreaStat> = {};
  const credit = (
    bucket: Record<string, AreaStat>,
    key: string,
    min: number,
    max: number,
  ) => {
    const s = bucket[key];
    if (s) {
      s.count += 1;
      s.budgetMin = Math.min(s.budgetMin, min);
      s.budgetMax = Math.max(s.budgetMax, max);
    } else {
      bucket[key] = { count: 1, budgetMin: min, budgetMax: max };
    }
  };

  for (const seeker of seekers) {
    if (!seeker.active) continue;
    const min = seeker.budgetRangeMin ?? seeker.budget ?? 0;
    const max = seeker.budget ?? 0;
    const councils = new Set<string>();
    for (const town of seeker.towns) {
      const id = townToAreaId(town);
      if (!id) continue;
      credit(byPlace, id, min, max);
      councils.add(id.split("/")[0]);
    }
    for (const c of councils) credit(byCouncil, c, min, max);
  }
  return { byPlace, byCouncil };
}
