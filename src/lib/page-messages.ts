// Every failure path in `actions.ts` signals by appending a query param to a
// redirect — `?error=report-size`, `?error=phone`, `?uploaded=1` and so on.
// Most of the receiving pages never declared `searchParams`, so those signals
// were silently discarded: you could upload a 30MB Home Report and land back on
// an identical page with an empty file input and no explanation.
//
// This is the copy for each one, in one place so the wording stays consistent
// and so a new signal in actions.ts has an obvious home.

export type PageMessage = {
  tone: "info" | "success" | "warning" | "error";
  title: string;
  body: string;
};

/** `/dashboard/home/[id]` — the seller's listing page, where most of them land. */
export const SELLER_HOME_MESSAGES: Record<string, PageMessage> = {
  // Errors
  invalid: {
    tone: "error",
    title: "Three things are still needed",
    body: "A listing needs a headline, an area and your estimate of the value before it can be saved. Fill in whichever is missing and save again.",
  },
  phone: {
    tone: "error",
    title: "We need a phone number first",
    body: "The surveyor arranges the visit directly with you, so they need a number to call. Add one and try again.",
  },
  negotiation: {
    tone: "error",
    title: "We couldn't price that Home Report",
    body: "No quote came back for that supplier at your home's value. Try a different supplier, or contact us and we'll arrange it by hand.",
  },
  checkout: {
    tone: "error",
    title: "We couldn't open the payment page",
    body: "Nothing has been charged. Try again in a moment — if it keeps happening, tell us and we'll invoice you instead.",
  },
  report: {
    tone: "error",
    title: "No file was attached",
    body: "Choose the Home Report PDF and submit again.",
  },
  "report-type": {
    tone: "error",
    title: "That file isn't a PDF",
    body: "Home Reports must be a PDF. If yours arrived as a scan or a Word file, export it to PDF and try again.",
  },
  "report-size": {
    tone: "error",
    title: "That file is too large",
    body: "Home Reports must be under 25MB. Most are well under — if yours is a photo scan, ask your surveyor for the original PDF.",
  },
  "report-upload": {
    tone: "error",
    title: "The upload didn't finish",
    body: "Nothing was saved. Check your connection and try again; the file is unchanged on your machine.",
  },
  slot: {
    tone: "error",
    title: "That viewing slot was incomplete",
    body: "Pick both a date and a time, then add the slot again.",
  },
  counter: {
    tone: "error",
    title: "A counter needs an amount",
    body: "Enter the figure you want to counter at, then send it.",
  },
  // Successes
  uploaded: {
    tone: "success",
    title: "Home Report received",
    body: "We'll check it over and mark your listing verified. You don't need to do anything else.",
  },
  ordered: {
    tone: "success",
    title: "Home Report ordered",
    body: "Your surveyor has been instructed and will contact you directly to arrange the visit.",
  },
};

/** `/dashboard` — the signals that land on the seller/seeker home page. */
export const DASHBOARD_MESSAGES: Record<string, PageMessage> = {
  brief: {
    tone: "success",
    title: "Brief saved",
    body: "The Matchlist is scoring it against every live Hush Home now.",
  },
  seeker: {
    tone: "success",
    title: "Agreement signed",
    body: "You're a registered Quiet Seeker. Introductions can be made on your behalf from here.",
  },
  agreed: {
    tone: "success",
    title: "Offer agreed",
    body: "Both sides have agreed. It moves to the solicitors from here and we'll keep you posted.",
  },
  alerts: {
    tone: "success",
    title: "Alert preferences saved",
    body: "We'll use the new threshold for every future match.",
  },
};

/** `/matches` */
export const MATCHES_MESSAGES: Record<string, PageMessage> = {
  "slot-taken": {
    tone: "warning",
    title: "That slot has gone",
    body: "Someone booked it first. Pick another time — the seller's remaining slots are below.",
  },
};

/** `/admin/introductions` — the legal gate on making an introduction. */
export const ADMIN_INTRO_MESSAGES: Record<string, PageMessage> = {
  gate: {
    tone: "error",
    title: "Blocked by the legal gate",
    body: "That introduction can't be offered until both sides have signed. Nothing was sent.",
  },
  prelive: {
    tone: "error",
    title: "That home isn't live yet",
    body: "Introductions can only be offered once the listing is live on the Matchlist.",
  },
};


/** Resolve a param against a map, tolerating undefined and unknown values. */
export function messageFor(
  map: Record<string, PageMessage>,
  key: string | undefined,
): PageMessage | null {
  if (!key) return null;
  return map[key] ?? null;
}
