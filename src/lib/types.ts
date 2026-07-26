// Shared domain types. One source of truth for the whole app.

export type PropertyType =
  | "detached"
  | "semi-detached"
  | "terraced"
  | "bungalow"
  | "flat"
  | "cottage"
  | "townhouse";

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "detached", label: "Detached house" },
  { value: "semi-detached", label: "Semi-detached house" },
  { value: "terraced", label: "Terraced house" },
  { value: "bungalow", label: "Bungalow" },
  { value: "flat", label: "Flat / apartment" },
  { value: "cottage", label: "Cottage" },
  { value: "townhouse", label: "Townhouse" },
];

export type GardenPreference = "no-preference" | "nice-to-have" | "must-have";

export type BuyingPosition =
  | "cash-nothing-to-sell"
  | "cash-after-sale"
  | "mortgage-sold"
  | "mortgage-to-sell"
  | "first-time-buyer";

export const BUYING_POSITIONS: { value: BuyingPosition; label: string }[] = [
  { value: "cash-nothing-to-sell", label: "Cash buyer (nothing to sell)" },
  { value: "cash-after-sale", label: "Buying cash (after house sale)" },
  { value: "mortgage-sold", label: "Buying with mortgage (house sold)" },
  {
    value: "mortgage-to-sell",
    label: "Buying with mortgage (house still to sell)",
  },
  { value: "first-time-buyer", label: "First-time buyer (with mortgage)" },
];

export type FeatureTag =
  | "parking"
  | "garage"
  | "ensuite"
  | "period-features"
  | "new-build"
  | "sea-views"
  | "rural"
  | "home-office";

export const FEATURE_TAGS: { value: FeatureTag; label: string }[] = [
  { value: "parking", label: "Private parking" },
  { value: "garage", label: "Garage" },
  { value: "ensuite", label: "En-suite" },
  { value: "period-features", label: "Period features" },
  { value: "new-build", label: "New build" },
  { value: "sea-views", label: "Sea views" },
  { value: "rural", label: "Rural setting" },
  { value: "home-office", label: "Home office / study" },
];

export interface ContractSignature {
  typedName: string;
  signedAt: string; // ISO
  ip: string;
  version: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isAdmin?: boolean;
  createdAt: string;
  /**
   * "Possible match" alert threshold: notify + email when a NEW pairing for
   * this user's brief or home scores at least this %. 0 = alerts off.
   * Undefined = the default (90, the "It's a match" band).
   */
  matchAlertPct?: number;
}

/** A simulated outbound email — the prototype's outbox (seam for Resend). */
export interface OutboxEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface SeekerBrief {
  userId: string;
  /**
   * Public anonymised reference, e.g. "QS-2104" — used in URLs and on the
   * public seekers directory so the user id (and any name) never leaks.
   */
  publicRef: string;
  /** Public anonymised card title, e.g. "Cash buyer chasing the golf coast". */
  headline: string;
  /** Public anonymised story — first person, no identifying details. */
  story: string;
  /** Area ids from lib/areas.ts, e.g. "north-ayrshire/largs". */
  areas: string[];
  budgetMin: number;
  budgetMax: number;
  minBeds: number;
  minBaths: number;
  garden: GardenPreference;
  types: PropertyType[]; // empty = open to anything
  features: FeatureTag[];
  position: BuyingPosition;
  notes?: string;
  contract: ContractSignature | null;
  createdAt: string;
  updatedAt: string;
}

export type HomeReportStatus = "none" | "ordered" | "uploaded" | "verified";

export interface HomeReportInfo {
  status: HomeReportStatus;
  supplier?: "allied-surveyors" | "graham-sibbald";
  orderedAt?: string;
  invoiceId?: string;
  fileName?: string;
  uploadedAt?: string;
  verifiedAt?: string;
}

export type HomeStatus =
  | "draft" // being built by the seller
  | "pending-approval" // report uploaded, awaiting admin verification
  | "live"
  | "under-offer"
  | "sold"
  | "withdrawn";

export interface HushHome {
  id: string;
  sellerId: string;
  headline: string; // e.g. "Sunny Victorian terrace near the Meadows"
  areaId: string; // lib/areas.ts id
  addressLine: string; // private — shown to seller + admin, and post-viewing
  price: number;
  beds: number;
  baths: number;
  type: PropertyType;
  garden: boolean;
  features: FeatureTag[];
  description: string;
  photos: string[]; // storage paths or placeholder keys
  floorPlan: string | null;
  homeReport: HomeReportInfo;
  contract: ContractSignature | null;
  status: HomeStatus;
  createdAt: string;
}

export interface ViewingSlot {
  id: string;
  homeId: string;
  start: string; // ISO
  end: string; // ISO
  bookedBy: string | null; // seeker userId
}

export interface Viewing {
  id: string;
  homeId: string;
  seekerId: string;
  slotId: string;
  start: string;
  end: string;
  status: "booked" | "completed" | "cancelled";
  feedback?: string;
  stillInterested?: boolean | null;
}

export interface Lawyer {
  id: string;
  firm: string;
  contactName: string;
  location: string;
  feeEstimate: number; // typical purchase conveyancing fee, £ net
  blurb: string;
}

export type OfferStatus = "submitted" | "accepted" | "declined" | "countered";

export interface OfferEvent {
  at: string;
  event: string;
}

export interface Offer {
  id: string;
  homeId: string;
  seekerId: string;
  lawyerId: string;
  amount: number;
  note?: string;
  status: OfferStatus;
  counterAmount?: number;
  history: OfferEvent[];
  createdAt: string;
  /** Set by admin when missives conclude — triggers the sourcing fee invoice. */
  missivesConcludedAt?: string;
}

export type InvoiceKind =
  | "home-report"
  | "conveyancing-deposit"
  | "sourcing-fee"
  | "withdrawal-fee";

export interface Invoice {
  id: string;
  userId: string;
  homeId?: string;
  offerId?: string;
  lawyerId?: string;
  kind: InvoiceKind;
  description: string;
  net: number;
  vat: number;
  status: "due" | "paid";
  createdAt: string;
  paidAt?: string;
}

export type NotificationKind = "match" | "viewing" | "offer" | "system";

export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  createdAt: string;
  readAt?: string | null;
}

export interface MatchWeights {
  location: number;
  price: number;
  beds: number;
  type: number;
  baths: number;
  garden: number;
  other: number;
}

/** A seeker's saved/shortlisted homes ("the Matchlist"). */
export interface SavedHome {
  seekerId: string;
  homeId: string;
  savedAt: string;
}

/**
 * A seller-initiated introduction: someone saw a Quiet Seeker's public
 * profile and said "I think they'd want my home". The seeker's identity is
 * never revealed. The flow is one-way and admin-gated:
 *
 *   new      — clicker has an account; their home profile may not exist yet
 *   offered  — both sides fully registered, home details in place; admin has
 *              offered the seeker the choice to see the home
 *   accepted — the seeker said yes; they can now view the Hush Home
 *   declined — the seeker said no; the seller is told, nothing is revealed
 */
export type IntroductionStatus = "new" | "offered" | "accepted" | "declined";

export interface Introduction {
  id: string;
  /** The Quiet Seeker whose public profile was clicked (brief userId). */
  seekerId: string;
  /** The account that clicked "they might want my home". */
  sellerId: string;
  /** The seller's Hush Home, once one exists to attach. */
  homeId: string | null;
  status: IntroductionStatus;
  createdAt: string;
  offeredAt?: string;
  respondedAt?: string;
}

/** Records a match the user has already been told about (no repeat fanfare). */
export interface SeenMatch {
  userId: string;
  key: string; // `${homeId}:${seekerId}`
  pct: number;
  seenAt: string;
}
