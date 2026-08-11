// The Match Report engine (BUILD-BRIEF.md §6.1) — the most important screen
// in the product runs on this.
//
// A seller describes their home in four strokes (area, beds, type, value
// band) and we count the registered Quiet Seekers whose briefs it matches.
// THE LEGAL GATE APPLIES IN THE OTHER DIRECTION TOO: this module tells the
// SELLER about matching BUYERS. It must never expose anything about any
// property, and it never fabricates a count — an empty result is reported
// honestly (§6.1) with a nearby-region count and an email capture instead.

import { activeBriefs, matchWeights } from "./db";
import { fetchMowattSeekers } from "./mowatt-seekers";
import { toBriefLike } from "./mowatt-bridge";
import { getArea, type AreaInfo } from "./areas";
import { scoreMatch } from "./match";
import { CONFIG } from "./site";
import type { HushHome, PropertyType, SeekerBrief } from "./types";

export type ValueBandId = (typeof CONFIG.valueBands)[number]["id"];

export interface MatchReportInput {
  areaId: string;
  beds: number;
  type: PropertyType;
  band: ValueBandId;
}

export interface MatchReportSnippet {
  /** The brief's public headline, for partial display only. */
  headline: string;
  /** e.g. "Cash buyer, nothing to sell" */
  positionLabel: string;
  pct: number;
}

export interface MatchReport {
  count: number;
  cashOrNoChain: number;
  topPct: number | null;
  snippet: MatchReportSnippet | null;
  area: AreaInfo;
  /** Honest empty-state helper: seekers active in the wider region. */
  regionCount: number;
  regionLabel: string;
}

const NO_CHAIN = new Set(["cash-nothing-to-sell", "cash-after-sale", "mortgage-sold"]);

const POSITION_LINES: Record<string, string> = {
  "cash-nothing-to-sell": "Cash buyer, nothing to sell",
  "cash-after-sale": "Cash buyer once their sale completes",
  "mortgage-sold": "Mortgage agreed, already sold",
  "mortgage-to-sell": "Mortgage buyer with a home to sell",
  "first-time-buyer": "First-time buyer",
};

/**
 * Every brief the Matchlist can score: registered briefs from the database
 * plus the live sheet seekers, briefs-alike. All anonymised at source.
 */
async function allScorableBriefs(): Promise<SeekerBrief[]> {
  const registered = await activeBriefs();
  const { seekers } = await fetchMowattSeekers();
  const sheet = seekers.filter((s) => s.active).map(toBriefLike);
  return [...registered, ...sheet];
}

/**
 * Build the synthetic home the four inputs describe. Deliberately generous
 * on unknowns (garden, features) — the report is a signal of appetite, and
 * the copy presents it as such, never as a valuation.
 */
function syntheticHome(input: MatchReportInput): HushHome {
  const band = CONFIG.valueBands.find((b) => b.id === input.band)!;
  return {
    id: "match-report-probe",
    sellerId: "match-report-probe",
    headline: "",
    areaId: input.areaId,
    addressLine: "",
    price: band.mid,
    beds: input.beds,
    baths: Math.max(1, Math.min(3, input.beds - 1)),
    type: input.type,
    garden: true,
    features: [],
    description: "",
    photos: [],
    floorPlan: null,
    homeReport: { status: "none" },
    contract: null,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

/** Region = everything before the slash in an area id ("east-lothian/..."). */
function regionOf(areaId: string): string {
  return areaId.split("/")[0] ?? areaId;
}

export async function runMatchReport(
  input: MatchReportInput,
): Promise<MatchReport | null> {
  const area = getArea(input.areaId);
  const band = CONFIG.valueBands.find((b) => b.id === input.band);
  if (!area || !band || input.beds < 1) return null;

  const [briefs, weights] = await Promise.all([allScorableBriefs(), matchWeights()]);
  const probe = syntheticHome(input);

  const scored = briefs
    .map((brief) => ({ brief, pct: scoreMatch(probe, brief, weights).pct }))
    .filter(({ pct }) => pct >= CONFIG.matchBands.worthALook)
    .sort((a, b) => b.pct - a.pct);

  const region = regionOf(input.areaId);
  const regionCount = briefs.filter((b) =>
    b.areas.some((a) => regionOf(a) === region),
  ).length;

  const top = scored[0];
  return {
    count: scored.length,
    cashOrNoChain: scored.filter(({ brief }) => NO_CHAIN.has(brief.position)).length,
    topPct: top?.pct ?? null,
    snippet: top?.brief.headline
      ? {
          headline: top.brief.headline,
          positionLabel:
            POSITION_LINES[top.brief.position] ?? "Position verified at registration",
          pct: top.pct,
        }
      : null,
    area,
    regionCount,
    regionLabel: area.councilName,
  };
}

/**
 * The same engine pointed at a real listing — the §6.3 go-live screen and
 * the shadow-listing dashboard both use this. Still tells the seller only
 * about buyers; nothing about the home leaves this function.
 */
export async function runMatchReportForHome(home: HushHome): Promise<{
  count: number;
  cashOrNoChain: number;
  topPct: number | null;
}> {
  const [briefs, weights] = await Promise.all([allScorableBriefs(), matchWeights()]);
  const scored = briefs
    .filter((b) => b.userId !== home.sellerId)
    .map((brief) => ({ brief, pct: scoreMatch(home, brief, weights).pct }))
    .filter(({ pct }) => pct >= CONFIG.matchBands.worthALook);
  const top = Math.max(...scored.map((s) => s.pct), 0);
  return {
    count: scored.length,
    cashOrNoChain: scored.filter(({ brief }) => NO_CHAIN.has(brief.position)).length,
    topPct: scored.length ? top : null,
  };
}
