// In-memory data store, seeded from sample data.
//
// The prototype runs with zero backend setup: every read and write goes
// through this module. State survives hot reloads via globalThis but resets
// when the server restarts — exactly like the Mowatt prototype's sample mode.
// supabase/migrations/ holds the matching production schema; swapping this
// module's internals for Supabase queries is the planned production step.

import {
  sampleBriefs,
  sampleHomes,
  sampleIntroductions,
  sampleInvoices,
  sampleLawyers,
  sampleNotifications,
  sampleOffers,
  sampleSaved,
  sampleSlots,
  sampleUsers,
  sampleViewings,
} from "./sample-data";
import { DEFAULT_WEIGHTS } from "./match";
import type {
  AppNotification,
  HushHome,
  Introduction,
  Invoice,
  Lawyer,
  MatchWeights,
  Offer,
  OutboxEmail,
  SavedHome,
  SeekerBrief,
  SeenMatch,
  User,
  Viewing,
  ViewingSlot,
} from "./types";

interface Store {
  users: User[];
  briefs: SeekerBrief[];
  homes: HushHome[];
  lawyers: Lawyer[];
  slots: ViewingSlot[];
  viewings: Viewing[];
  offers: Offer[];
  invoices: Invoice[];
  saved: SavedHome[];
  notifications: AppNotification[];
  introductions: Introduction[];
  seenMatches: SeenMatch[];
  /** Simulated outbound email log (newest last). */
  emails: OutboxEmail[];
  /** Dedupe for "possible match" alerts: one per user per pairing key. */
  sentAlerts: { userId: string; key: string; sentAt: string }[];
  weights: MatchWeights;
  counter: number;
}

function seed(): Store {
  // Deep-clone the samples so mutations never touch module constants.
  return structuredClone({
    users: sampleUsers,
    briefs: sampleBriefs,
    homes: sampleHomes,
    lawyers: sampleLawyers,
    slots: sampleSlots,
    viewings: sampleViewings,
    offers: sampleOffers,
    invoices: sampleInvoices,
    saved: sampleSaved,
    notifications: sampleNotifications,
    introductions: sampleIntroductions,
    seenMatches: [] as SeenMatch[],
    emails: [] as OutboxEmail[],
    sentAlerts: [] as { userId: string; key: string; sentAt: string }[],
    weights: DEFAULT_WEIGHTS,
    counter: 1000,
  });
}

const g = globalThis as unknown as { __matchlistedStore?: Store };

export function store(): Store {
  if (!g.__matchlistedStore) g.__matchlistedStore = seed();
  return g.__matchlistedStore;
}

export function resetStore(): void {
  g.__matchlistedStore = seed();
}

export function newId(prefix: string): string {
  const s = store();
  s.counter += 1;
  return `${prefix}-${s.counter}`;
}

// ---- Users ----------------------------------------------------------------

export function getUser(id: string): User | undefined {
  return store().users.find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  const e = email.trim().toLowerCase();
  return store().users.find((u) => u.email.toLowerCase() === e);
}

export function createUser(input: { name: string; email: string }): User {
  const user: User = {
    id: newId("u"),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };
  store().users.push(user);
  return user;
}

// ---- Briefs ---------------------------------------------------------------

export function getBrief(userId: string): SeekerBrief | undefined {
  return store().briefs.find((b) => b.userId === userId);
}

export function upsertBrief(brief: SeekerBrief): void {
  const s = store();
  const i = s.briefs.findIndex((b) => b.userId === brief.userId);
  if (i >= 0) s.briefs[i] = brief;
  else s.briefs.push(brief);
}

/** Briefs that are contract-signed — the only ones the engine matches. */
export function activeBriefs(): SeekerBrief[] {
  return store().briefs.filter((b) => b.contract !== null);
}

/** Find a brief by its public anonymised ref (the /seekers/[ref] URL id). */
export function getBriefByPublicRef(ref: string): SeekerBrief | undefined {
  return store().briefs.find((b) => b.publicRef === ref);
}

// ---- Introductions --------------------------------------------------------

export function getIntroduction(id: string): Introduction | undefined {
  return store().introductions.find((i) => i.id === id);
}

export function allIntroductions(): Introduction[] {
  return [...store().introductions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function introductionsForSeeker(seekerId: string): Introduction[] {
  return allIntroductions().filter((i) => i.seekerId === seekerId);
}

export function introductionsBySeller(sellerId: string): Introduction[] {
  return allIntroductions().filter((i) => i.sellerId === sellerId);
}

export function findIntroduction(
  seekerId: string,
  sellerId: string,
): Introduction | undefined {
  return store().introductions.find(
    (i) => i.seekerId === seekerId && i.sellerId === sellerId,
  );
}

export function upsertIntroduction(intro: Introduction): void {
  const s = store();
  const i = s.introductions.findIndex((x) => x.id === intro.id);
  if (i >= 0) s.introductions[i] = intro;
  else s.introductions.push(intro);
}

// ---- Homes ----------------------------------------------------------------

export function getHome(id: string): HushHome | undefined {
  return store().homes.find((h) => h.id === id);
}

export function homesBySeller(sellerId: string): HushHome[] {
  return store().homes.filter((h) => h.sellerId === sellerId);
}

export function liveHomes(): HushHome[] {
  return store().homes.filter(
    (h) => h.status === "live" || h.status === "under-offer",
  );
}

export function allHomes(): HushHome[] {
  return store().homes;
}

export function upsertHome(home: HushHome): void {
  const s = store();
  const i = s.homes.findIndex((h) => h.id === home.id);
  if (i >= 0) s.homes[i] = home;
  else s.homes.push(home);
}

// ---- Lawyers --------------------------------------------------------------

export function allLawyers(): Lawyer[] {
  return store().lawyers;
}

export function getLawyer(id: string): Lawyer | undefined {
  return store().lawyers.find((l) => l.id === id);
}

export function upsertLawyer(lawyer: Lawyer): void {
  const s = store();
  const i = s.lawyers.findIndex((l) => l.id === lawyer.id);
  if (i >= 0) s.lawyers[i] = lawyer;
  else s.lawyers.push(lawyer);
}

export function removeLawyer(id: string): void {
  const s = store();
  s.lawyers = s.lawyers.filter((l) => l.id !== id);
}

// ---- Viewing slots + viewings --------------------------------------------

export function slotsForHome(homeId: string): ViewingSlot[] {
  return store()
    .slots.filter((sl) => sl.homeId === homeId)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function getSlot(id: string): ViewingSlot | undefined {
  return store().slots.find((sl) => sl.id === id);
}

export function addSlot(slot: ViewingSlot): void {
  store().slots.push(slot);
}

export function removeSlot(id: string): void {
  const s = store();
  s.slots = s.slots.filter((sl) => sl.id !== id || sl.bookedBy !== null);
}

export function viewingsForSeeker(seekerId: string): Viewing[] {
  return store().viewings.filter((v) => v.seekerId === seekerId);
}

export function viewingsForHome(homeId: string): Viewing[] {
  return store().viewings.filter((v) => v.homeId === homeId);
}

export function getViewing(id: string): Viewing | undefined {
  return store().viewings.find((v) => v.id === id);
}

export function upsertViewing(viewing: Viewing): void {
  const s = store();
  const i = s.viewings.findIndex((v) => v.id === viewing.id);
  if (i >= 0) s.viewings[i] = viewing;
  else s.viewings.push(viewing);
}

// ---- Offers ---------------------------------------------------------------

export function offersForHome(homeId: string): Offer[] {
  return store().offers.filter((o) => o.homeId === homeId);
}

export function offersForSeeker(seekerId: string): Offer[] {
  return store().offers.filter((o) => o.seekerId === seekerId);
}

export function allOffers(): Offer[] {
  return store().offers;
}

export function getOffer(id: string): Offer | undefined {
  return store().offers.find((o) => o.id === id);
}

export function upsertOffer(offer: Offer): void {
  const s = store();
  const i = s.offers.findIndex((o) => o.id === offer.id);
  if (i >= 0) s.offers[i] = offer;
  else s.offers.push(offer);
}

// ---- Invoices -------------------------------------------------------------

export function invoicesForUser(userId: string): Invoice[] {
  return store().invoices.filter((i) => i.userId === userId);
}

export function allInvoices(): Invoice[] {
  return store().invoices;
}

export function getInvoice(id: string): Invoice | undefined {
  return store().invoices.find((i) => i.id === id);
}

export function upsertInvoice(invoice: Invoice): void {
  const s = store();
  const i = s.invoices.findIndex((x) => x.id === invoice.id);
  if (i >= 0) s.invoices[i] = invoice;
  else s.invoices.push(invoice);
}

// ---- Matchlist (saved homes) ---------------------------------------------

export function savedForSeeker(seekerId: string): SavedHome[] {
  return store().saved.filter((sv) => sv.seekerId === seekerId);
}

export function toggleSaved(seekerId: string, homeId: string): boolean {
  const s = store();
  const i = s.saved.findIndex(
    (sv) => sv.seekerId === seekerId && sv.homeId === homeId,
  );
  if (i >= 0) {
    s.saved.splice(i, 1);
    return false;
  }
  s.saved.push({ seekerId, homeId, savedAt: new Date().toISOString() });
  return true;
}

// ---- Notifications --------------------------------------------------------

export function notificationsForUser(userId: string): AppNotification[] {
  return store()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function pushNotification(
  n: Omit<AppNotification, "id" | "createdAt" | "readAt">,
): void {
  store().notifications.push({
    ...n,
    id: newId("n"),
    createdAt: new Date().toISOString(),
    readAt: null,
  });
}

export function markNotificationsRead(userId: string): void {
  const now = new Date().toISOString();
  for (const n of store().notifications) {
    if (n.userId === userId && !n.readAt) n.readAt = now;
  }
}

// ---- Email outbox (simulated sends) ---------------------------------------

export function recordEmail(email: Omit<OutboxEmail, "id" | "createdAt">): void {
  store().emails.push({
    ...email,
    id: newId("mail"),
    createdAt: new Date().toISOString(),
  });
}

export function allEmails(): OutboxEmail[] {
  return [...store().emails].reverse(); // newest first
}

// ---- "Possible match" alert dedupe ---------------------------------------

export function hasAlerted(userId: string, key: string): boolean {
  return store().sentAlerts.some((a) => a.userId === userId && a.key === key);
}

export function recordAlert(userId: string, key: string): void {
  if (hasAlerted(userId, key)) return;
  store().sentAlerts.push({ userId, key, sentAt: new Date().toISOString() });
}

// ---- Seen matches (no repeat "It's a match" fanfare) ----------------------

export function hasSeenMatch(userId: string, key: string): boolean {
  return store().seenMatches.some(
    (m) => m.userId === userId && m.key === key,
  );
}

export function recordSeenMatch(userId: string, key: string, pct: number): void {
  if (hasSeenMatch(userId, key)) return;
  store().seenMatches.push({
    userId,
    key,
    pct,
    seenAt: new Date().toISOString(),
  });
}

// ---- Match weights (admin-tunable) ---------------------------------------

export function matchWeights(): MatchWeights {
  return store().weights;
}

export function setMatchWeights(w: MatchWeights): void {
  store().weights = w;
}
