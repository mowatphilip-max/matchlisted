// Canonical site URL. Set NEXT_PUBLIC_SITE_URL in the deploy environment;
// falls back to a placeholder for the prototype.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://matchlisted.example"
).replace(/\/$/, "");

export const SITE_NAME = "Matchlisted";
export const SITE_TAGLINE = "Where Quiet Seekers meet Hush Homes";

// Fees (all + VAT). Single source of truth — quoted across the site.
export const VAT_RATE = 0.2;
export const HOME_REPORT_MARGIN = 100; // our margin per Home Report, £
export const WITHDRAWAL_FEE = 300; // seller lists elsewhere on the open market, £
export const CONVEYANCING_DEPOSIT = 100; // to appoint a lawyer before offering, £
export const SOURCING_FEE_RATE = 0.008; // 0.8% of purchase price, on missives

export function withVat(net: number): number {
  return Math.round(net * (1 + VAT_RATE) * 100) / 100;
}

export function sourcingFee(purchasePrice: number): number {
  return Math.round(purchasePrice * SOURCING_FEE_RATE);
}

export const CONTRACT_VERSIONS = {
  seeker: "seeker-v1.0-2026-07",
  seller: "seller-v1.0-2026-07",
} as const;

// ---- Home Report pricing --------------------------------------------------
//
// Surveyor fees are BANDED by the owner's estimate of their home's value
// (corrected later if the Home Report says otherwise). The quote we charge:
//
//   total = band fee + 20% VAT + our £100 arrangement fee
//   e.g. £310,000 estimate → Allied band £650 → £650 + £130 VAT + £100 = £880
//
// Allied's bands are their real Edinburgh / East & West Lothian Fee Scale
// (May 2024). Graham + Sibbald and Shepherd currently mirror that scale as
// an indicative placeholder — swap in their own fee scales when supplied.

/** [max value of band (inclusive), fee £ ex VAT] — ascending. */
type FeeBand = readonly [number, number];

const ALLIED_BANDS: readonly FeeBand[] = [
  [100000, 400],
  [200000, 450],
  [300000, 550],
  [400000, 650],
  [500000, 750],
  [600000, 800],
  [700000, 850],
  [800000, 900],
  [900000, 950],
  [1000000, 1000],
  [1100000, 1050],
  [1250000, 1200],
  [1500000, 1300],
  // £1,500,001+ is "by negotiation" — no band, quote returns null.
];

export const HOME_REPORT_SUPPLIERS = [
  {
    id: "allied-surveyors",
    name: "Allied Surveyors Scotland",
    blurb:
      "Scotland's largest independent firm of chartered surveyors, with local surveyors in every region.",
    // Prototype outbox address — put their real instruction inbox here
    // (e.g. edinburgh@alliedsurveyorsscotland.com) when email goes live.
    email: "bookings@allied-surveyors.demo",
    bands: ALLIED_BANDS,
    indicative: false,
  },
  {
    id: "graham-sibbald",
    name: "Graham + Sibbald",
    blurb:
      "Chartered surveyors established 1959, trusted for Home Reports across every Scottish property type.",
    email: "bookings@graham-sibbald.demo",
    bands: ALLIED_BANDS,
    indicative: true,
  },
  {
    id: "shepherd",
    name: "Shepherd Chartered Surveyors",
    blurb:
      "One of the UK's largest firms of chartered surveyors, surveying Scottish homes from over 30 local offices.",
    email: "bookings@shepherd-surveyors.demo",
    bands: ALLIED_BANDS,
    indicative: true,
  },
] as const;

export type HomeReportSupplierId =
  (typeof HOME_REPORT_SUPPLIERS)[number]["id"];

export interface HomeReportQuote {
  base: number; // surveyor's banded fee, ex VAT
  vat: number; // 20% of the base
  margin: number; // our arrangement fee
  total: number; // what the owner pays on the site
}

/**
 * Quote a Home Report from the owner's value estimate. Returns null above
 * £1.5m — that's "by negotiation" with the surveyor.
 */
export function homeReportQuote(
  supplierId: string,
  estimatedValue: number,
): HomeReportQuote | null {
  const supplier = HOME_REPORT_SUPPLIERS.find((s) => s.id === supplierId);
  if (!supplier || estimatedValue <= 0) return null;
  const band = supplier.bands.find(([max]) => estimatedValue <= max);
  if (!band) return null;
  const base = band[1];
  const vat = Math.round(base * VAT_RATE * 100) / 100;
  return { base, vat, margin: HOME_REPORT_MARGIN, total: base + vat + HOME_REPORT_MARGIN };
}
