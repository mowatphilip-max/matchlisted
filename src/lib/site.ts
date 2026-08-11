// Canonical site URL. Set NEXT_PUBLIC_SITE_URL in the deploy environment;
// falls back to a placeholder for the prototype.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://matchlisted.example"
).replace(/\/$/, "");

export const SITE_NAME = "Matchlisted";
export const SITE_TAGLINE = "Where Quiet Seekers meet Hush Homes";

// Fees. Single source of truth — quoted across the site. Every
// CONSUMER-facing figure is stored and shown INCLUSIVE of VAT (DECISIONS.md
// §1 condition 3: no "+ VAT" anywhere a seller or buyer can see). B2B
// figures (the case pack fee) are the one exception and stay net.
export const VAT_RATE = 0.2;
export const HOME_REPORT_MARGIN = 100; // our margin per Home Report, £
// WITHDRAWAL_FEE is gone (DECISIONS.md §3): abolished 10 Aug 2026. On
// withdrawal, listing elsewhere or the longstop the seller owes the Home
// Report charge and nothing else — two stacked charges risked being an
// unenforceable penalty under the Consumer Rights Act.
// CONVEYANCING_DEPOSIT is gone (DECISIONS.md §0.5): conditioning an offer on
// appointing/paying for a lawyer is conditional selling. Nothing is payable
// to submit an offer.

// The buyer fee lives in CONFIG.fees.buyerFeeGross (£360 inc VAT, fixed,
// every transaction) — the old net BUYER_FEE constant is gone with the
// VAT-inclusive rule. Ledger rows derive net/vat via exVat().

// ---- Build-brief config (docs/BUILD-BRIEF.md) ------------------------------
//
// Every number the brief marks [config], in one place. The constants above
// are the CURRENT running model; the values below are the January 2027
// deferred-fee model, adopted phase by phase. When a phase switches a flow
// over, it must read from here — never inline a fee or threshold.
export const CONFIG = {
  fees: {
    /**
     * Home Report charge, £ inc VAT. Deferred: solicitor at settlement, or
     * stored card on withdrawal / listed elsewhere / longstop — after
     * cardNoticeDays' written notice. On withdrawal this is the ONLY thing
     * the seller owes: the withdrawal fee was abolished 10 Aug 2026
     * (DECISIONS.md §3).
     */
    homeReportGross: 580,
    /** Rightmove listing add-on, £ inc VAT. Stripe Checkout, upfront. */
    rightmoveAddonGross: 240,
    /** Professional photography add-on, £ inc VAT. Stripe Checkout, upfront. */
    photographyAddonGross: 354,
    /**
     * For Sale board add-on, £ inc VAT (DECISIONS.md §2). A Hush Home is
     * private BY DEFAULT and the add-ons are the volume knob: Rightmove
     * takes the seller public online, a board takes them public locally,
     * both by choice (§4). Config and schema only for now — the
     * purchase/fulfilment path is built once, in Phase 6, and photography
     * and Rightmove reuse it.
     */
    boardAddonGross: 120,
    /** Buyer fee, £ inc VAT, fixed, every transaction. Solicitor at settlement. */
    buyerFeeGross: 360,
    /**
     * Case preparation fee, £ ex VAT, B2B — invoiced to the PANEL FIRM,
     * never to a consumer, so it is quoted "+ VAT" and lives on the firm
     * ledger (DECISIONS.md §6). Trigger is pack_delivered and NEVER
     * missives_concluded: a fee payable on completion is transaction
     * commission however it is labelled (LSS rule D9.2). Never refundable
     * on fall-through; contingency makes it commission again.
     */
    casePackFeeNet: 150,
  },
  /**
   * Listing-claim copy (CAP Code / DMCCA). NEVER write a bare "free" claim
   * for the listing anywhere — use these strings. The sub-line flips to the
   * deferred wording when Phase 3 switches collection over (one-line edit).
   */
  copy: {
    listingHeadline: "No listing fee. No commission.",
    listingSubline: "You pay only for your Home Report.",
    // Phase 3: listingSubline becomes "Pay for your Home Report when you sell."
  },
  /** goLiveAt + this many months → expired (longstop). Under legal review — may be switched off. */
  longstopMonths: 12,
  /** Days a listing is live with no 90%+ match before the Rightmove nudge. */
  nudgeAfterDays: 42,
  /** Days of written notice before any stored-card charge. */
  cardNoticeDays: 14,
  /** AML verification validity, months, before re-verification. */
  amlRevalidateMonths: 12,
  /** Listing approval minimum standards. */
  listingStandards: {
    minPhotos: 6,
    minPhotoLongEdgePx: 1200,
    minDescriptionWords: 150,
  },
  /** Town hub pages (/looking-in/[town]) require at least this many live seekers. */
  townHubMinSeekers: 3,
  /** Never send more than this many match emails per user per day. */
  maxMatchEmailsPerUserPerDay: 1,
  matchBands: {
    match: 90, // ≥ this: "It's a match", both sides notified
    worthALook: 50, // ≥ this: "Worth a look"; below: not surfaced
  },
  /** Value bands for the public Match Report (§6.1). mid drives scoring. */
  valueBands: [
    { id: "to250", label: "Up to £250,000", mid: 200000 },
    { id: "250-400", label: "£250,000 – £400,000", mid: 325000 },
    { id: "400-600", label: "£400,000 – £600,000", mid: 500000 },
    { id: "600-900", label: "£600,000 – £900,000", mid: 750000 },
    { id: "900plus", label: "£900,000+", mid: 1100000 },
  ],
} as const;

// ---- Legal entity (footer + policy pages) ----------------------------------
//
// Matchlisted.com is a TRADING NAME of Mowatt – Move Smarter Ltd; Mowatt's
// existing redress, HMRC AML and ICO registrations are treated as covering
// it (Phase 1 review decision). Facts still null are open items — Phil
// supplies them; never invent. The footer renders bracketed "to follow"
// markers until they are filled in.
export const LEGAL = {
  tradingName: "Matchlisted.com",
  companyName: "Mowatt – Move Smarter Ltd",
  /** e.g. "SC123456" */
  companyNumber: null as string | null,
  registeredOffice: null as string | null,
  vatNumber: null as string | null,
  /** e.g. "The Property Ombudsman" */
  redressSchemeName: null as string | null,
  redressSchemeNumber: null as string | null,
  amlSupervisionNumber: null as string | null,
  icoRegistration: null as string | null,
} as const;

export function withVat(net: number): number {
  return Math.round(net * (1 + VAT_RATE) * 100) / 100;
}

/**
 * The net (ex VAT) share of a VAT-inclusive price, to 2dp — for ledger and
 * invoice rows, which stay net + vat. Display never uses this: consumers
 * only ever see the gross figure.
 */
export function exVat(gross: number): number {
  return Math.round((gross / (1 + VAT_RATE)) * 100) / 100;
}


export const CONTRACT_VERSIONS = {
  // v1.1: conveyancing-deposit clause removed (DECISIONS.md §0.5 — an offer
  // is never conditional on appointing or paying for a solicitor).
  seeker: "seeker-v1.1-2026-08",
  // v1.1: £300 withdrawal fee removed (DECISIONS.md §3) and the "solicitor
  // already appointed" line dropped from the offers clause (§0.5).
  seller: "seller-v1.1-2026-08",
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
