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

export const HOME_REPORT_SUPPLIERS = [
  {
    id: "allied-surveyors",
    name: "Allied Surveyors Scotland",
    blurb:
      "Scotland's largest independent firm of chartered surveyors, with local surveyors in every region.",
    // Illustrative supplier pricing bands by value; our £100 margin is added.
    priceFrom: 425,
  },
  {
    id: "graham-sibbald",
    name: "Graham + Sibbald",
    blurb:
      "Chartered surveyors established 1959, trusted for Home Reports across every Scottish property type.",
    priceFrom: 450,
  },
] as const;

export type HomeReportSupplierId =
  (typeof HOME_REPORT_SUPPLIERS)[number]["id"];
