// The data layer — every read and write goes through here.
//
// Backed by Postgres (Supabase). Function names and shapes match the old
// in-memory prototype store one-for-one, so call sites only had to gain an
// `await`. Everything runs with the SERVER key, which bypasses row-level
// security — so permission checks belong in the calling code, never here.

import { serverDb } from "./supabase";
import {
  fromBrief,
  fromCharge,
  fromFirmInvoice,
  fromHome,
  fromIntroduction,
  fromInvoice,
  fromPanelFirm,
  fromPurchaseOrder,
  fromUser,
  toAuditEntry,
  toBrief,
  toCharge,
  toEmail,
  toFirmInvoice,
  toHome,
  toIntroduction,
  toInvoice,
  toPanelFirm,
  toPurchaseOrder,
  toPurchaseOrder as toPO,
  toUser,
} from "./db-mappers";
import { DEFAULT_WEIGHTS } from "./match";
import type {
  AppNotification,
  AuditEntry,
  Charge,
  FirmInvoice,
  PanelFirm,
  HushHome,
  Introduction,
  Invoice,
  Lawyer,
  MatchWeights,
  Offer,
  OutboxEmail,
  PurchaseOrder,
  SavedHome,
  SeekerBrief,
  User,
  Viewing,
  ViewingSlot,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Throw on a real database error; treat "no rows" as simply absent. */
function unwrap<T>(res: { data: T | null; error: any }, context: string): T | null {
  if (res.error && res.error.code !== "PGRST116") {
    throw new Error(`${context}: ${res.error.message}`);
  }
  return res.data;
}

/** New primary key. Postgres would default these, but the app builds whole
 *  objects before saving, so it needs the id up front. */
export function newId(): string {
  return crypto.randomUUID();
}

// ---- Users / profiles -----------------------------------------------------

export async function getUser(id: string): Promise<User | undefined> {
  const res = await serverDb().from("profiles").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getUser");
  return row ? toUser(row) : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const res = await serverDb()
    .from("profiles")
    .select("*")
    .ilike("email", email.trim())
    .maybeSingle();
  const row = unwrap(res, "getUserByEmail");
  return row ? toUser(row) : undefined;
}

/**
 * Someone to send back-office alerts to. The prototype hardcoded a demo id;
 * now we look up a real administrator. Returns null if none exists yet, so
 * a missing admin can never crash a customer's action.
 */
export async function adminUserId(): Promise<string | null> {
  const res = await serverDb()
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  const row = unwrap(res, "adminUserId");
  return row?.id ?? null;
}

/**
 * Every profile keyed by id. Admin tables need a name against each row;
 * fetching them once beats one query per row, and lets the render stay
 * synchronous (a React server component can't await inside a loop).
 */
export async function usersById(): Promise<Map<string, User>> {
  const users = await allUsers();
  return new Map(users.map((u) => [u.id, u]));
}

/** Every home keyed by id — same reasoning as usersById(). */
export async function homesById(): Promise<Map<string, HushHome>> {
  const homes = await allHomes();
  return new Map(homes.map((h) => [h.id, h]));
}

export async function allUsers(): Promise<User[]> {
  const res = await serverDb().from("profiles").select("*").order("created_at");
  return (unwrap(res, "allUsers") ?? []).map(toUser);
}

/** Create the profile row for an existing Supabase Auth account. */
export async function createProfile(input: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
}): Promise<User> {
  const res = await serverDb()
    .from("profiles")
    .insert({
      id: input.id,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone ?? null,
      is_admin: input.isAdmin ?? false,
    })
    .select("*")
    .single();
  const row = unwrap(res, "createProfile");
  if (!row) throw new Error("createProfile returned no row");
  return toUser(row);
}

export async function upsertUser(user: User): Promise<void> {
  const res = await serverDb().from("profiles").upsert(fromUser(user));
  unwrap(res as any, "upsertUser");
}

// ---- Briefs ---------------------------------------------------------------

export async function getBrief(userId: string): Promise<SeekerBrief | undefined> {
  const res = await serverDb()
    .from("seeker_briefs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const row = unwrap(res, "getBrief");
  return row ? toBrief(row) : undefined;
}

export async function upsertBrief(brief: SeekerBrief): Promise<void> {
  const res = await serverDb().from("seeker_briefs").upsert(fromBrief(brief));
  unwrap(res as any, "upsertBrief");
}

/** Briefs that are contract-signed — the only ones the engine matches. */
export async function activeBriefs(): Promise<SeekerBrief[]> {
  const res = await serverDb()
    .from("seeker_briefs")
    .select("*")
    .not("contract_signed_at", "is", null);
  return (unwrap(res, "activeBriefs") ?? []).map(toBrief);
}

/** Find a brief by its public anonymised ref (the /seekers/[ref] URL id). */
export async function getBriefByPublicRef(
  ref: string,
): Promise<SeekerBrief | undefined> {
  const res = await serverDb()
    .from("seeker_briefs")
    .select("*")
    .eq("public_ref", ref)
    .maybeSingle();
  const row = unwrap(res, "getBriefByPublicRef");
  return row ? toBrief(row) : undefined;
}

/** Next public Quiet Seeker reference (QS-2304), allocated by Postgres. */
export async function nextSeekerRef(): Promise<string> {
  const res = await serverDb().rpc("next_seeker_ref");
  if (res.error) throw new Error(`nextSeekerRef: ${res.error.message}`);
  return res.data as unknown as string;
}

// ---- Introductions --------------------------------------------------------

export async function getIntroduction(id: string): Promise<Introduction | undefined> {
  const res = await serverDb().from("introductions").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getIntroduction");
  return row ? toIntroduction(row) : undefined;
}

export async function allIntroductions(): Promise<Introduction[]> {
  const res = await serverDb()
    .from("introductions")
    .select("*")
    .order("created_at", { ascending: false });
  return (unwrap(res, "allIntroductions") ?? []).map(toIntroduction);
}

export async function introductionsForSeeker(seekerId: string): Promise<Introduction[]> {
  const res = await serverDb()
    .from("introductions")
    .select("*")
    .eq("seeker_ref", seekerId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "introductionsForSeeker") ?? []).map(toIntroduction);
}

export async function introductionsBySeller(sellerId: string): Promise<Introduction[]> {
  const res = await serverDb()
    .from("introductions")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "introductionsBySeller") ?? []).map(toIntroduction);
}

export async function findIntroduction(
  seekerId: string,
  sellerId: string,
): Promise<Introduction | undefined> {
  const res = await serverDb()
    .from("introductions")
    .select("*")
    .eq("seeker_ref", seekerId)
    .eq("seller_id", sellerId)
    .maybeSingle();
  const row = unwrap(res, "findIntroduction");
  return row ? toIntroduction(row) : undefined;
}

export async function upsertIntroduction(intro: Introduction): Promise<void> {
  const res = await serverDb().from("introductions").upsert(fromIntroduction(intro));
  unwrap(res as any, "upsertIntroduction");
}

// ---- Homes ----------------------------------------------------------------
//
// THE LEGAL GATE (docs/BUILD-BRIEF.md §3, Housing (Scotland) Act 2006
// ss.98/101): no listing, and no attribute of one, may be exposed to anyone
// but its owner or an admin until the Home Report is received and verified.
// Every viewer-facing read goes through getHomeFor(); getHomeUnscoped() is
// for owner-checked, admin-gated, or system code paths ONLY — if you are
// rendering a home to a user, you want getHomeFor.

/** Statuses a registered Quiet Seeker may ever see (BUILD-BRIEF.md §5). */
export const PUBLIC_HOME_STATUSES = ["live", "under-offer", "sold"] as const;

function isPublicStatus(status: HushHome["status"]): boolean {
  return (PUBLIC_HOME_STATUSES as readonly string[]).includes(status);
}

/**
 * The §3 visibility scope. Returns the home only when the viewer is allowed
 * to know it exists: anyone if the status is public (live / under-offer /
 * sold); the owner or an admin, always.
 *
 * There are NO other exceptions. s.101(3) Housing (Scotland) Act 2006
 * catches communication of availability to ANY person, with no consent
 * carve-out, and the Home Report must exist at the moment of the act — so
 * an Introduction, however consented, cannot open a pre-live home. A
 * raised hand on a pre-live home is queued and fires when the home goes
 * live (see offerQueuedIntroductions).
 */
export async function getHomeFor(
  id: string,
  viewer: { id: string; isAdmin?: boolean } | null,
): Promise<HushHome | undefined> {
  const home = await getHomeUnscoped(id);
  if (!home) return undefined;
  if (isPublicStatus(home.status)) return home;
  if (!viewer) return undefined;
  if (viewer.isAdmin || home.sellerId === viewer.id) return home;
  return undefined;
}

/**
 * Raw read with NO visibility scope. Owner-checked actions, admin-gated
 * pages and system jobs only. Never hand its result to a viewer without a
 * check — use getHomeFor for that.
 */
export async function getHomeUnscoped(id: string): Promise<HushHome | undefined> {
  const res = await serverDb().from("hush_homes").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getHome");
  return row ? toHome(row) : undefined;
}

export async function homesBySeller(sellerId: string): Promise<HushHome[]> {
  const res = await serverDb()
    .from("hush_homes")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "homesBySeller") ?? []).map(toHome);
}

export async function liveHomes(): Promise<HushHome[]> {
  const res = await serverDb()
    .from("hush_homes")
    .select("*")
    .in("status", ["live", "under-offer"])
    .order("created_at", { ascending: false });
  return (unwrap(res, "liveHomes") ?? []).map(toHome);
}

// previewHomes() is gone (4 Aug 2026). It exposed pre-Home-Report listings
// to seekers as hazed "preview" cards, which BUILD-BRIEF.md §3 forbids
// outright: nothing pre-live may be communicated to any section of the
// public. The preview_listed column stays in the schema but nothing reads
// it for display any more.

export async function allHomes(): Promise<HushHome[]> {
  const res = await serverDb()
    .from("hush_homes")
    .select("*")
    .order("created_at", { ascending: false });
  return (unwrap(res, "allHomes") ?? []).map(toHome);
}

export async function upsertHome(home: HushHome): Promise<void> {
  const res = await serverDb().from("hush_homes").upsert(fromHome(home));
  unwrap(res as any, "upsertHome");
}

// ---- Lawyers --------------------------------------------------------------

function toLawyer(row: any): Lawyer {
  return {
    id: row.id,
    firm: row.firm,
    contactName: row.contact_name,
    location: row.location,
    feeEstimate: Number(row.fee_estimate),
    blurb: row.blurb ?? "",
  };
}

export async function allLawyers(): Promise<Lawyer[]> {
  const res = await serverDb().from("lawyers").select("*").order("firm");
  return (unwrap(res, "allLawyers") ?? []).map(toLawyer);
}

export async function getLawyer(id: string): Promise<Lawyer | undefined> {
  const res = await serverDb().from("lawyers").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getLawyer");
  return row ? toLawyer(row) : undefined;
}

export async function upsertLawyer(lawyer: Lawyer): Promise<void> {
  const res = await serverDb().from("lawyers").upsert({
    id: lawyer.id,
    firm: lawyer.firm,
    contact_name: lawyer.contactName,
    location: lawyer.location,
    fee_estimate: lawyer.feeEstimate,
    blurb: lawyer.blurb,
  });
  unwrap(res as any, "upsertLawyer");
}

export async function removeLawyer(id: string): Promise<void> {
  const res = await serverDb().from("lawyers").delete().eq("id", id);
  unwrap(res as any, "removeLawyer");
}

// ---- Viewing slots + viewings --------------------------------------------

function toSlot(row: any): ViewingSlot {
  return {
    id: row.id,
    homeId: row.home_id,
    start: row.starts_at,
    end: row.ends_at,
    bookedBy: row.booked_by ?? null,
  };
}

export async function slotsForHome(homeId: string): Promise<ViewingSlot[]> {
  const res = await serverDb()
    .from("viewing_slots")
    .select("*")
    .eq("home_id", homeId)
    .order("starts_at");
  return (unwrap(res, "slotsForHome") ?? []).map(toSlot);
}

export async function getSlot(id: string): Promise<ViewingSlot | undefined> {
  const res = await serverDb().from("viewing_slots").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getSlot");
  return row ? toSlot(row) : undefined;
}

export async function addSlot(slot: ViewingSlot): Promise<void> {
  const res = await serverDb().from("viewing_slots").insert({
    id: slot.id,
    home_id: slot.homeId,
    starts_at: slot.start,
    ends_at: slot.end,
    booked_by: slot.bookedBy,
  });
  unwrap(res as any, "addSlot");
}

export async function updateSlot(slot: ViewingSlot): Promise<void> {
  const res = await serverDb()
    .from("viewing_slots")
    .update({ booked_by: slot.bookedBy })
    .eq("id", slot.id);
  unwrap(res as any, "updateSlot");
}

/** Only removes unbooked slots — a booked one is somebody's appointment. */
export async function removeSlot(id: string): Promise<void> {
  const res = await serverDb()
    .from("viewing_slots")
    .delete()
    .eq("id", id)
    .is("booked_by", null);
  unwrap(res as any, "removeSlot");
}

function toViewing(row: any): Viewing {
  return {
    id: row.id,
    homeId: row.home_id,
    seekerId: row.seeker_id,
    slotId: row.slot_id,
    start: row.starts_at,
    end: row.ends_at,
    status: row.status,
    feedback: row.feedback ?? undefined,
    stillInterested: row.still_interested ?? null,
  };
}

export async function viewingsForSeeker(seekerId: string): Promise<Viewing[]> {
  const res = await serverDb().from("viewings").select("*").eq("seeker_id", seekerId);
  return (unwrap(res, "viewingsForSeeker") ?? []).map(toViewing);
}

export async function viewingsForHome(homeId: string): Promise<Viewing[]> {
  const res = await serverDb().from("viewings").select("*").eq("home_id", homeId);
  return (unwrap(res, "viewingsForHome") ?? []).map(toViewing);
}

export async function getViewing(id: string): Promise<Viewing | undefined> {
  const res = await serverDb().from("viewings").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getViewing");
  return row ? toViewing(row) : undefined;
}

export async function upsertViewing(viewing: Viewing): Promise<void> {
  const res = await serverDb().from("viewings").upsert({
    id: viewing.id,
    home_id: viewing.homeId,
    seeker_id: viewing.seekerId,
    slot_id: viewing.slotId,
    starts_at: viewing.start,
    ends_at: viewing.end,
    status: viewing.status,
    feedback: viewing.feedback ?? null,
    still_interested: viewing.stillInterested ?? null,
  });
  unwrap(res as any, "upsertViewing");
}

// ---- Offers ---------------------------------------------------------------

function toOffer(row: any): Offer {
  return {
    id: row.id,
    homeId: row.home_id,
    seekerId: row.seeker_id,
    lawyerId: row.lawyer_id,
    amount: Number(row.amount),
    note: row.note ?? undefined,
    status: row.status,
    counterAmount: row.counter_amount ? Number(row.counter_amount) : undefined,
    history: row.history ?? [],
    createdAt: row.created_at,
    missivesConcludedAt: row.missives_concluded_at ?? undefined,
  };
}

function fromOffer(offer: Offer) {
  return {
    id: offer.id,
    home_id: offer.homeId,
    seeker_id: offer.seekerId,
    lawyer_id: offer.lawyerId,
    amount: offer.amount,
    note: offer.note ?? null,
    status: offer.status,
    counter_amount: offer.counterAmount ?? null,
    history: offer.history,
    missives_concluded_at: offer.missivesConcludedAt ?? null,
  };
}

export async function offersForHome(homeId: string): Promise<Offer[]> {
  const res = await serverDb().from("offers").select("*").eq("home_id", homeId);
  return (unwrap(res, "offersForHome") ?? []).map(toOffer);
}

export async function offersForSeeker(seekerId: string): Promise<Offer[]> {
  const res = await serverDb().from("offers").select("*").eq("seeker_id", seekerId);
  return (unwrap(res, "offersForSeeker") ?? []).map(toOffer);
}

export async function allOffers(): Promise<Offer[]> {
  const res = await serverDb()
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });
  return (unwrap(res, "allOffers") ?? []).map(toOffer);
}

export async function getOffer(id: string): Promise<Offer | undefined> {
  const res = await serverDb().from("offers").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getOffer");
  return row ? toOffer(row) : undefined;
}

export async function upsertOffer(offer: Offer): Promise<void> {
  const res = await serverDb().from("offers").upsert(fromOffer(offer));
  unwrap(res as any, "upsertOffer");
}

// ---- Invoices -------------------------------------------------------------

export async function invoicesForUser(userId: string): Promise<Invoice[]> {
  const res = await serverDb()
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "invoicesForUser") ?? []).map(toInvoice);
}

export async function allInvoices(): Promise<Invoice[]> {
  const res = await serverDb()
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  return (unwrap(res, "allInvoices") ?? []).map(toInvoice);
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  const res = await serverDb().from("invoices").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getInvoice");
  return row ? toInvoice(row) : undefined;
}

export async function upsertInvoice(invoice: Invoice): Promise<void> {
  const res = await serverDb().from("invoices").upsert(fromInvoice(invoice));
  unwrap(res as any, "upsertInvoice");
}

// ---- Matchlist (saved homes) ---------------------------------------------

export async function savedForSeeker(seekerId: string): Promise<SavedHome[]> {
  const res = await serverDb().from("saved_homes").select("*").eq("seeker_id", seekerId);
  return (unwrap(res, "savedForSeeker") ?? []).map((r: any) => ({
    seekerId: r.seeker_id,
    homeId: r.home_id,
    savedAt: r.saved_at,
  }));
}

export async function toggleSaved(seekerId: string, homeId: string): Promise<boolean> {
  const db = serverDb();
  const existing = await db
    .from("saved_homes")
    .select("home_id")
    .eq("seeker_id", seekerId)
    .eq("home_id", homeId)
    .maybeSingle();
  if (existing.data) {
    await db.from("saved_homes").delete().eq("seeker_id", seekerId).eq("home_id", homeId);
    return false;
  }
  await db.from("saved_homes").insert({ seeker_id: seekerId, home_id: homeId });
  return true;
}

// ---- Notifications --------------------------------------------------------

function toNotification(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
  };
}

export async function notificationsForUser(userId: string): Promise<AppNotification[]> {
  const res = await serverDb()
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "notificationsForUser") ?? []).map(toNotification);
}

export async function pushNotification(
  n: Omit<AppNotification, "id" | "createdAt" | "readAt">,
): Promise<void> {
  const res = await serverDb().from("notifications").insert({
    user_id: n.userId,
    kind: n.kind,
    title: n.title,
    body: n.body,
    href: n.href ?? null,
  });
  unwrap(res as any, "pushNotification");
}

export async function markNotificationsRead(userId: string): Promise<void> {
  const res = await serverDb()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  unwrap(res as any, "markNotificationsRead");
}

// ---- Email log ------------------------------------------------------------

export async function recordEmail(
  email: Omit<OutboxEmail, "id" | "createdAt"> & {
    providerMessageId?: string;
    error?: string;
  },
): Promise<void> {
  const res = await serverDb().from("emails").insert({
    to_address: email.to,
    subject: email.subject,
    body: email.body,
    provider_message_id: email.providerMessageId ?? null,
    error: email.error ?? null,
  });
  unwrap(res as any, "recordEmail");
}

export async function allEmails(): Promise<OutboxEmail[]> {
  const res = await serverDb()
    .from("emails")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (unwrap(res, "allEmails") ?? []).map(toEmail);
}

// ---- Purchase orders ------------------------------------------------------

export async function allPurchaseOrders(): Promise<PurchaseOrder[]> {
  const res = await serverDb()
    .from("purchase_orders")
    .select("*")
    .order("created_at", { ascending: false });
  return (unwrap(res, "allPurchaseOrders") ?? []).map(toPO);
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
  const res = await serverDb().from("purchase_orders").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getPurchaseOrder");
  return row ? toPurchaseOrder(row) : undefined;
}

export async function upsertPurchaseOrder(po: PurchaseOrder): Promise<void> {
  const res = await serverDb().from("purchase_orders").upsert(fromPurchaseOrder(po));
  unwrap(res as any, "upsertPurchaseOrder");
}

/** Next purchase-order reference (PO-1042), allocated by Postgres so two
 *  simultaneous orders can never share a number. */
export async function nextPurchaseOrderRef(): Promise<string> {
  const res = await serverDb().rpc("next_purchase_order_ref");
  if (res.error) throw new Error(`nextPurchaseOrderRef: ${res.error.message}`);
  return res.data as unknown as string;
}

// ---- "Possible match" alert dedupe ---------------------------------------

export async function hasAlerted(userId: string, key: string): Promise<boolean> {
  const res = await serverDb()
    .from("sent_alerts")
    .select("alert_key")
    .eq("user_id", userId)
    .eq("alert_key", key)
    .maybeSingle();
  return Boolean(unwrap(res, "hasAlerted"));
}

export async function recordAlert(userId: string, key: string): Promise<void> {
  // Primary key is (user_id, alert_key), so a duplicate is simply ignored.
  serverDb()
    .from("sent_alerts")
    .upsert({ user_id: userId, alert_key: key }, { onConflict: "user_id,alert_key" });
}

// ---- Seen matches (no repeat "It's a match" fanfare) ----------------------

export async function hasSeenMatch(userId: string, key: string): Promise<boolean> {
  const res = await serverDb()
    .from("seen_matches")
    .select("match_key")
    .eq("user_id", userId)
    .eq("match_key", key)
    .maybeSingle();
  return Boolean(unwrap(res, "hasSeenMatch"));
}

export async function recordSeenMatch(
  userId: string,
  key: string,
  pct: number,
): Promise<void> {
  serverDb()
    .from("seen_matches")
    .upsert(
      { user_id: userId, match_key: key, pct },
      { onConflict: "user_id,match_key" },
    );
}

// ---- Match weights (admin-tunable) ---------------------------------------

export async function matchWeights(): Promise<MatchWeights> {
  const res = await serverDb().from("match_weights").select("*").eq("id", 1).maybeSingle();
  const row = unwrap(res, "matchWeights");
  if (!row) return DEFAULT_WEIGHTS;
  return {
    location: row.location,
    price: row.price,
    beds: row.beds,
    type: row.type,
    baths: row.baths,
    garden: row.garden,
    other: row.other,
  };
}

export async function setMatchWeights(w: MatchWeights): Promise<void> {
  const res = await serverDb().from("match_weights").upsert({ id: 1, ...w });
  unwrap(res as any, "setMatchWeights");
}

// ---- Charges: the fee ledger (BUILD-BRIEF.md §4, Phase 1) -----------------
//
// A charge is an obligation, not a payment. Phase 1 lands the model and the
// accessors; the Phase 3 trigger engine is what moves statuses around.

export async function createCharge(
  input: Omit<Charge, "id" | "createdAt" | "updatedAt">,
): Promise<Charge> {
  const now = new Date().toISOString();
  const charge: Charge = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  const res = await serverDb().from("charges").insert(fromCharge(charge));
  unwrap(res as any, "createCharge");
  await audit(null, "charge.created", "charge", charge.id, {
    type: charge.type,
    status: charge.status,
    gross: charge.grossAmount,
    payer: charge.payerUserId,
  });
  return charge;
}

export async function getCharge(id: string): Promise<Charge | undefined> {
  const res = await serverDb().from("charges").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getCharge");
  return row ? toCharge(row) : undefined;
}

export async function chargesForPayer(payerUserId: string): Promise<Charge[]> {
  const res = await serverDb()
    .from("charges")
    .select("*")
    .eq("payer_user_id", payerUserId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "chargesForPayer") ?? []).map(toCharge);
}

export async function chargesForSubject(
  subjectType: Charge["subjectType"],
  subjectId: string,
): Promise<Charge[]> {
  const res = await serverDb()
    .from("charges")
    .select("*")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "chargesForSubject") ?? []).map(toCharge);
}

/** Admin collections view. Filters land with the Phase 3 screen. */
export async function allCharges(): Promise<Charge[]> {
  const res = await serverDb()
    .from("charges")
    .select("*")
    .order("created_at", { ascending: false });
  return (unwrap(res, "allCharges") ?? []).map(toCharge);
}

/**
 * Every charge state change goes through here so the transition is audited.
 * No state machine yet — Phase 3's trigger engine owns which moves are legal.
 */
export async function updateCharge(
  id: string,
  patch: Partial<
    Pick<
      Charge,
      | "status"
      | "trigger"
      | "dueAt"
      | "collectionRoute"
      | "stripePaymentIntent"
      | "mandateId"
      | "notes"
    >
  >,
  actorId: string | null,
): Promise<void> {
  const before = await getCharge(id);
  if (!before) throw new Error(`updateCharge: no charge ${id}`);
  const after: Charge = { ...before, ...patch, updatedAt: new Date().toISOString() };
  const res = await serverDb().from("charges").update(fromCharge(after)).eq("id", id);
  unwrap(res as any, "updateCharge");
  await audit(actorId, "charge.updated", "charge", id, {
    from: before.status,
    to: after.status,
    patch,
  });
}

// ---- Panel firms + the firm ledger (DECISIONS.md §6) ----------------------
//
// B2B only. Consumer charges and firm invoices are separate ledgers: the
// charges table carries consumer-protection machinery, none of which
// applies to a business invoice to a law firm. Never merge them.

export async function createPanelFirm(
  input: Omit<PanelFirm, "id" | "createdAt" | "updatedAt">,
): Promise<PanelFirm> {
  const now = new Date().toISOString();
  const firm: PanelFirm = { ...input, id: newId(), createdAt: now, updatedAt: now };
  const res = await serverDb().from("panel_firms").insert(fromPanelFirm(firm));
  unwrap(res as any, "createPanelFirm");
  await audit(null, "panel_firm.created", "panel_firm", firm.id, {
    name: firm.name,
    territory: firm.territory,
    seatFeeAnnual: firm.seatFeeAnnual,
  });
  return firm;
}

export async function getPanelFirm(id: string): Promise<PanelFirm | undefined> {
  const res = await serverDb().from("panel_firms").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res, "getPanelFirm");
  return row ? toPanelFirm(row) : undefined;
}

export async function allPanelFirms(): Promise<PanelFirm[]> {
  const res = await serverDb()
    .from("panel_firms")
    .select("*")
    .order("name", { ascending: true });
  return (unwrap(res, "allPanelFirms") ?? []).map(toPanelFirm);
}

export async function createFirmInvoice(
  input: Omit<FirmInvoice, "id" | "createdAt" | "updatedAt">,
): Promise<FirmInvoice> {
  const now = new Date().toISOString();
  const invoice: FirmInvoice = { ...input, id: newId(), createdAt: now, updatedAt: now };
  const res = await serverDb().from("firm_invoices").insert(fromFirmInvoice(invoice));
  unwrap(res as any, "createFirmInvoice");
  await audit(null, "firm_invoice.created", "firm_invoice", invoice.id, {
    kind: invoice.kind,
    firmId: invoice.firmId,
    listingId: invoice.listingId ?? null,
    gross: invoice.grossAmount,
  });
  return invoice;
}

export async function firmInvoicesForFirm(firmId: string): Promise<FirmInvoice[]> {
  const res = await serverDb()
    .from("firm_invoices")
    .select("*")
    .eq("firm_id", firmId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "firmInvoicesForFirm") ?? []).map(toFirmInvoice);
}

export async function allFirmInvoices(): Promise<FirmInvoice[]> {
  const res = await serverDb()
    .from("firm_invoices")
    .select("*")
    .order("created_at", { ascending: false });
  return (unwrap(res, "allFirmInvoices") ?? []).map(toFirmInvoice);
}

/** Every firm-invoice state change is audited, like updateCharge. */
export async function updateFirmInvoice(
  id: string,
  patch: Partial<
    Pick<FirmInvoice, "status" | "dueAt" | "invoicedAt" | "paidAt" | "notes">
  >,
  actorId: string | null,
): Promise<void> {
  const res0 = await serverDb().from("firm_invoices").select("*").eq("id", id).maybeSingle();
  const row = unwrap(res0, "updateFirmInvoice.read");
  if (!row) throw new Error(`updateFirmInvoice: no firm invoice ${id}`);
  const before = toFirmInvoice(row);
  const after: FirmInvoice = { ...before, ...patch, updatedAt: new Date().toISOString() };
  const res = await serverDb().from("firm_invoices").update(fromFirmInvoice(after)).eq("id", id);
  unwrap(res as any, "updateFirmInvoice");
  await audit(actorId, "firm_invoice.updated", "firm_invoice", id, {
    from: before.status,
    to: after.status,
    patch,
  });
}

// ---- Audit log (append-only) ----------------------------------------------

/**
 * Record who did what to what. Never throws — an audit failure must not
 * take down the action it was recording; it logs loudly instead.
 */
export async function audit(
  actorId: string | null,
  action: string,
  subjectType: string,
  subjectId: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  try {
    const res = await serverDb().from("audit_log").insert({
      actor_id: actorId,
      action,
      subject_type: subjectType,
      subject_id: subjectId,
      meta,
    });
    unwrap(res as any, "audit");
  } catch (err) {
    console.error(`AUDIT WRITE FAILED (${action} on ${subjectType}/${subjectId}):`, err);
  }
}

export async function auditForSubject(
  subjectType: string,
  subjectId: string,
  limit = 100,
): Promise<AuditEntry[]> {
  const res = await serverDb()
    .from("audit_log")
    .select("*")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .order("at", { ascending: false })
    .limit(limit);
  return (unwrap(res, "auditForSubject") ?? []).map(toAuditEntry);
}
