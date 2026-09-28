import { getArea } from "./areas";
import {
  DEMO_SEEKERS,
  type DemoBriefType,
  type DemoPosition,
  type DemoSeeker,
} from "./demo-data";

// Live Quiet Seekers from the shared Mowatt Google Sheets.
//
// The mowatt.uk Quiet Seeker pages are rendered from two public Google
// Sheets (one per region) — those sheets ARE the master seeker database,
// maintained by the Mowatt team. We read the same sheets server-side with a
// 5-minute revalidate, so a row added by the team appears here without a
// redeploy, and we can never break mowatt.uk because we never write.
//
// The sheets hold only anonymised fields by design (ref, title, areas,
// beds/baths/etc, copy, budget, active). No names, emails, phones or
// addresses exist in these tabs — and nothing beyond the parsed public
// shape below ever leaves this module.
//
// propertyType / readiness / budget ranges are DERIVED here from the title,
// copy and budget text using the rules Phil approved (2026-07-27). Anything
// ambiguous falls back to the safe default: propertyType "any", readiness
// empty, vetted false. If the team later adds real override columns (M+)
// to the sheets, read them here — additive only.

const SHEETS = [
  {
    region: "East Lothian" as const,
    id: "14tgkRIDTaE2SJpNpllkqZLwKMVf696kNOMGwRocfgz4",
    tab: "East Lothian Quiet Seekers",
  },
  {
    region: "Edinburgh" as const,
    id: "1pdJGZqHUnS2R_7_geEabX7JTeRezMog6T5engVgpmhY",
    tab: "Edinburgh Quiet Seekers",
  },
];

// Column order in both sheets (headers=2 row carries team notes).
const COL = {
  REF: 0,
  TITLE: 1,
  AREAS: 2,
  BEDS: 3,
  BATHS: 4,
  KITCHEN: 5,
  LIVING: 6,
  GARDEN: 7,
  PARKING: 8,
  COPY: 9,
  BUDGET: 10,
  ACTIVE: 11,
} as const;

export const SEEKER_PROPERTY_TYPES = [
  { key: "tenement_flat", label: "Tenement flat", group: "Flat" },
  { key: "newbuild_apartment", label: "New-build apartment", group: "Flat" },
  { key: "main_door_flat", label: "Main-door flat", group: "Flat" },
  { key: "top_floor_flat", label: "Top-floor flat", group: "Flat" },
  { key: "bungalow", label: "Bungalow", group: "House" },
  { key: "detached", label: "Detached house", group: "House" },
  { key: "semi_detached", label: "Semi-detached", group: "House" },
  { key: "terraced", label: "Terraced / townhouse", group: "House" },
  { key: "cottage", label: "Cottage", group: "House" },
  { key: "country_house", label: "Country house", group: "House" },
  { key: "any", label: "Open to any property type", group: "Any" },
] as const;

export type SeekerPropertyType = (typeof SEEKER_PROPERTY_TYPES)[number]["key"];

export const READINESS_LABELS = {
  cash_buyer: "Cash buyer",
  chain_free: "Chain-free",
  offer_accepted: "Offer accepted",
  solicitor_instructed: "Solicitor instructed",
  mortgage_aip: "Mortgage AIP",
  flexible_entry: "Flexible entry",
  deposit_ready: "Deposit ready",
  local: "Local",
  repeat_buyer: "Repeat buyer",
} as const;

export type SeekerReadiness = keyof typeof READINESS_LABELS;

/** The full public shape — every field here is safe for the client. */
export interface MowattSeeker {
  ref: string;
  region: "East Lothian" | "Edinburgh";
  title: string;
  /** The areas field exactly as the team wrote it — for display. */
  areasLabel: string;
  /** Cleaned town tokens — for filtering/matching. */
  towns: string[];
  beds: string; // display text, e.g. "2/3"
  bedsMin: number | null;
  baths: string;
  kitchen: string;
  living: string;
  garden: boolean;
  parking: string;
  copy: string;
  budgetLabel: string; // e.g. "£600K CASH" — as written by the team
  budget: number | null; // parsed midpoint, £
  budgetRangeMin: number | null;
  budgetRangeMax: number | null;
  active: boolean;
  propertyType: SeekerPropertyType; // first/primary — drives the card icon
  propertyTypes: SeekerPropertyType[]; // full set for matching/filtering
  readiness: SeekerReadiness[];
  vetted: boolean; // no source column yet — always false until one exists
}

// ---- derivation rules (approved) ------------------------------------------

/** Ordered — first match wins the primary slot; all matches are kept. */
const TYPE_RULES: { key: SeekerPropertyType; re: RegExp }[] = [
  { key: "bungalow", re: /bungalow/i },
  { key: "cottage", re: /cottage/i },
  { key: "semi_detached", re: /semi[- ]?detached|semi\b/i },
  { key: "detached", re: /(?<!semi[- ])detached/i },
  { key: "terraced", re: /terrace|townhouse|town house|colonies/i },
  { key: "country_house", re: /country house|farmhouse|steading|acres|small ?holding|estate house|with land/i },
  { key: "tenement_flat", re: /tenement/i },
  { key: "main_door_flat", re: /main[- ]?door/i },
  { key: "top_floor_flat", re: /top[- ]?floor/i },
  { key: "newbuild_apartment", re: /new[- ]?build (apartment|flat)|modern apartment/i },
];

const READINESS_RULES: { key: SeekerReadiness; re: RegExp }[] = [
  { key: "cash_buyer", re: /\bcash\b/i },
  { key: "chain_free", re: /no chain|chain[- ]?free|nothing to sell|no onward chain/i },
  { key: "offer_accepted", re: /offer accepted|accepted an offer|under offer on (?:their|his|her) own/i },
  { key: "mortgage_aip", re: /\bAIP\b|agreement in principle|mortgage (?:agreed|approved|in principle)/i },
  { key: "flexible_entry", re: /flexible (?:on )?entry|entry date to suit|flexible timescales?/i },
  { key: "deposit_ready", re: /deposit (?:in place|ready|saved)/i },
  { key: "solicitor_instructed", re: /solicitor (?:instructed|appointed)/i },
];

function deriveTypes(text: string): SeekerPropertyType[] {
  const found = TYPE_RULES.filter((r) => r.re.test(text)).map((r) => r.key);
  return found.length ? [...new Set(found)] : ["any"];
}

function deriveReadiness(text: string): SeekerReadiness[] {
  return READINESS_RULES.filter((r) => r.re.test(text)).map((r) => r.key);
}

/** "£800K" → 800000 · "£1.4m CASH" → 1400000 · "£1,250,000" → 1250000. */
export function parseBudget(label: string): number | null {
  const m = label.replace(/,/g, "").match(/£?\s*(\d+(?:\.\d+)?)\s*([km])?/i);
  if (!m) return null;
  let value = parseFloat(m[1]);
  const unit = (m[2] ?? "").toLowerCase();
  if (unit === "k") value *= 1_000;
  else if (unit === "m") value *= 1_000_000;
  // Bare numbers under 10,000 read as thousands ("£800" is nobody's budget).
  else if (value < 10_000) value *= 1_000;
  return Math.round(value);
}

function parseBedsMin(text: string): number | null {
  const m = text.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

const round5k = (n: number) => Math.round(n / 5_000) * 5_000;

// ---- sheet fetch + parse --------------------------------------------------

function parseGviz(text: string): string[][] {
  const json = JSON.parse(
    text.substring(text.indexOf("(") + 1, text.lastIndexOf(")")),
  ) as { table: { rows: { c: ({ v: unknown } | null)[] }[] } };
  return json.table.rows.map((row) =>
    (row.c ?? []).map((cell) => (cell && cell.v != null ? String(cell.v) : "")),
  );
}

function toSeeker(
  row: string[],
  region: "East Lothian" | "Edinburgh",
): MowattSeeker | null {
  const ref = (row[COL.REF] ?? "").trim();
  if (!/^\d{3,8}$/.test(ref)) return null; // header noise / blank rows

  const title = (row[COL.TITLE] ?? "").trim();
  const copy = (row[COL.COPY] ?? "").trim();
  const budgetLabel = (row[COL.BUDGET] ?? "").trim();
  const haystack = `${title} ${copy} ${budgetLabel}`;

  const budget = budgetLabel ? parseBudget(budgetLabel) : null;
  const types = deriveTypes(`${title} ${copy}`);

  const areasLabel = (row[COL.AREAS] ?? "").trim();
  // Split into clean town tokens: drop parenthetical qualifiers ("(no
  // further east)"), split on commas/slashes/"or", strip trailing dots.
  const towns = [
    ...new Set(
      areasLabel
        .replace(/\([^)]*\)?/g, " ")
        .split(/,|\/|\bor\b/i)
        .map((t) => t.replace(/[.\s]+$/, "").trim())
        .filter(Boolean),
    ),
  ];

  return {
    ref,
    region,
    title,
    areasLabel,
    towns,
    beds: (row[COL.BEDS] ?? "").trim(),
    bedsMin: parseBedsMin(row[COL.BEDS] ?? ""),
    baths: (row[COL.BATHS] ?? "").trim(),
    kitchen: (row[COL.KITCHEN] ?? "").trim(),
    living: (row[COL.LIVING] ?? "").trim(),
    garden: (row[COL.GARDEN] ?? "").trim().toUpperCase() === "YES",
    parking: (row[COL.PARKING] ?? "").trim(),
    copy,
    budgetLabel,
    budget,
    budgetRangeMin: budget ? round5k(budget * 0.7) : null,
    budgetRangeMax: budget ? round5k(budget * 1.3) : null,
    active: (row[COL.ACTIVE] ?? "").trim().toUpperCase().startsWith("Y"),
    propertyType: types[0],
    propertyTypes: types,
    readiness: deriveReadiness(haystack),
    vetted: false,
  };
}

// ---- demo seekers ----------------------------------------------------------
//
// Maps the fictional buyers in lib/demo-data.ts into the directory's public
// shape. Only ever reached when MATCHLISTED_DEMO=1.

const DEMO_TYPE: Record<DemoBriefType, SeekerPropertyType> = {
  detached: "detached",
  "semi-detached": "semi_detached",
  terraced: "terraced",
  bungalow: "bungalow",
  flat: "tenement_flat",
  cottage: "cottage",
};

const DEMO_READINESS: Record<DemoPosition, SeekerReadiness[]> = {
  "cash-nothing-to-sell": ["cash_buyer", "chain_free"],
  "cash-after-sale": ["cash_buyer"],
  "mortgage-sold": ["mortgage_aip", "chain_free"],
  "mortgage-to-sell": ["mortgage_aip"],
  "first-time-buyer": ["mortgage_aip", "deposit_ready", "chain_free"],
};

const thousands = (n: number) => `£${Math.round(n / 1000)}K`;

function toDemoMowattSeeker(s: DemoSeeker, i: number): MowattSeeker {
  const places = s.areas.map((id) => getArea(id)?.place ?? id);
  const types: SeekerPropertyType[] = s.types.length
    ? s.types.map((t) => DEMO_TYPE[t])
    : ["any"];

  return {
    // The same numbering scripts/demo/seed-demo.mjs uses for
    // seeker_briefs.publicRef, so /seekers/QS-9101 resolves to the seeded
    // brief and the directory card and the matching engine are one buyer.
    ref: `QS-9${100 + i + 1}`,
    region: s.areas[0].startsWith("edinburgh/") ? "Edinburgh" : "East Lothian",
    title: s.headline,
    areasLabel: places.join(", "),
    towns: places,
    beds: `${s.beds}+`,
    bedsMin: s.beds,
    baths: "1+",
    // Left blank on purpose: the card renders these only when truthy, so an
    // empty string simply omits the line rather than printing an empty label.
    kitchen: "",
    living: "",
    parking: "",
    garden: s.garden,
    copy: s.story,
    budgetLabel: `${thousands(s.min)} – ${thousands(s.max)}`,
    budget: Math.round((s.min + s.max) / 2),
    budgetRangeMin: s.min,
    budgetRangeMax: s.max,
    active: true,
    propertyType: types[0],
    propertyTypes: types,
    readiness: DEMO_READINESS[s.position],
    vetted: false,
  };
}

/**
 * All Quiet Seekers from both regional sheets, active first (each group in
 * sheet order, which is the team's curation order). Cached ~5 minutes.
 * On a sheet outage returns whatever regions loaded; [] worst case.
 */
export async function fetchMowattSeekers(): Promise<{
  seekers: MowattSeeker[];
  skipped: number;
  failedRegions: string[];
}> {
  // Demo runs (docs/DEMO-VIDEO.md rule 3): no REAL Quiet Seeker may appear on
  // screen or be counted, so the Mowatt sheets are never read. Fictional ones
  // are served instead — the same people the demo seed writes as seeker_briefs,
  // so the directory and the matching tell one story. Returning an empty list
  // here used to leave "Who's looking" reading "0 Quiet Seekers" mid-demo.
  if (process.env.MATCHLISTED_DEMO === "1") {
    return { seekers: DEMO_SEEKERS.map(toDemoMowattSeeker), skipped: 0, failedRegions: [] };
  }

  const seekers: MowattSeeker[] = [];
  let skipped = 0;
  const failedRegions: string[] = [];

  await Promise.all(
    SHEETS.map(async (sheet) => {
      try {
        const url =
          `https://docs.google.com/spreadsheets/d/${sheet.id}/gviz/tq` +
          `?tqx=out:json&sheet=${encodeURIComponent(sheet.tab)}&headers=2`;
        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error(`sheet ${res.status}`);
        const rows = parseGviz(await res.text());
        for (const row of rows) {
          const s = toSeeker(row, sheet.region);
          if (s) seekers.push(s);
          else if (row.some((c) => c.trim())) skipped += 1;
        }
      } catch {
        failedRegions.push(sheet.region);
      }
    }),
  );

  seekers.sort((a, b) => Number(b.active) - Number(a.active));
  return { seekers, skipped, failedRegions };
}
