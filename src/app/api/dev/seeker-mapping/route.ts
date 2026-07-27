// Dev/review helper: how each live Mowatt sheet seeker maps onto the new
// derived fields (property type, readiness, parsed budget, town matching).
// Serves only the already-public anonymised fields — no more than /seekers
// itself renders.

import { NextResponse } from "next/server";
import { requireDevEnvironment } from "@/lib/dev-only";
import { townToAreaId } from "@/lib/mowatt-bridge";
import { fetchMowattSeekers } from "@/lib/mowatt-seekers";

export const dynamic = "force-dynamic";

export async function GET() {
  // LOCAL DEVELOPMENT ONLY — dumps the full seeker dataset.
  requireDevEnvironment();
  const { seekers, skipped, failedRegions } = await fetchMowattSeekers();

  const rows = seekers.map((s) => ({
    ref: s.ref,
    region: s.region,
    active: s.active,
    title: s.title.slice(0, 80),
    budgetLabel: s.budgetLabel,
    budgetParsed: s.budget,
    budgetRange: s.budget ? [s.budgetRangeMin, s.budgetRangeMax] : null,
    propertyTypes: s.propertyTypes,
    readiness: s.readiness,
    towns: s.towns.length,
    townsUnmatched: s.towns.filter((t) => !townToAreaId(t)),
  }));

  const count = <T extends string>(vals: T[]) =>
    vals.reduce<Record<string, number>>((acc, v) => {
      acc[v] = (acc[v] ?? 0) + 1;
      return acc;
    }, {});

  return NextResponse.json({
    total: seekers.length,
    active: seekers.filter((s) => s.active).length,
    skippedRows: skipped,
    failedRegions,
    propertyTypeCounts: count(seekers.map((s) => s.propertyType)),
    readinessCounts: count(seekers.flatMap((s) => s.readiness)),
    budgetUnparsed: rows.filter((r) => !r.budgetParsed).map((r) => ({ ref: r.ref, budgetLabel: r.budgetLabel })),
    townsUnmatched: [...new Set(rows.flatMap((r) => r.townsUnmatched))],
    rows,
  });
}
