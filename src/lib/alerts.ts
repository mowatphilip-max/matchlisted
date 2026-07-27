// "YOU HAVE A POSSIBLE MATCH" alerts, both directions:
//   - a Hush Home goes live  -> alert every Quiet Seeker it matches
//   - a seeker brief goes live -> alert every Hush Home seller it matches
// Each user picks their own threshold (User.matchAlertPct, default 90;
// 0 = off). One alert per user per pairing, ever. Every alert is an in-app
// notification plus an email into the outbox (the seam for Resend).

import {
  activeBriefs,
  getUser,
  hasAlerted,
  liveHomes,
  matchWeights,
  pushNotification,
  recordAlert,
  recordEmail,
} from "./db";
import { areaShortLabel } from "./areas";
import { formatBudget, formatPrice } from "./format";
import { scoreMatch } from "./match";
import {
  BUYING_POSITIONS,
  type HushHome,
  type SeekerBrief,
  type User,
} from "./types";

export const DEFAULT_ALERT_PCT = 90;

function threshold(user: User | undefined): number {
  const pct = user?.matchAlertPct;
  return pct === undefined ? DEFAULT_ALERT_PCT : pct;
}

async function deliver(user: User, pct: number, href: string, bodyLines: string[]) {
  await pushNotification({
    userId: user.id,
    kind: "match",
    title: `You have a possible match — ${pct}%`,
    body: bodyLines[0],
    href,
  });
  await recordEmail({
    to: user.email,
    subject: `YOU HAVE A POSSIBLE MATCH — ${pct}% on the Matchlist`,
    body: [
      `Hello ${user.name.split(" ")[0]},`,
      "",
      ...bodyLines,
      "",
      `See it here: ${href}`,
      "",
      "You chose to hear about matches at this level — change your alert level any time from your dashboard.",
      "— Matchlisted",
    ].join("\n"),
  });
}

/** A Hush Home has just gone live: tell every seeker it matches. */
export async function alertSeekersAboutHome(home: HushHome): Promise<number> {
  const weights = await matchWeights();
  let sent = 0;
  for (const brief of await activeBriefs()) {
    if (brief.userId === home.sellerId) continue;
    const user = await getUser(brief.userId);
    const min = threshold(user);
    if (!user || min <= 0) continue;
    const { pct } = scoreMatch(home, brief, weights);
    if (pct < min) continue;
    const key = `home-live:${home.id}`;
    if (await hasAlerted(user.id, key)) continue;
    await recordAlert(user.id, key);
    deliver(user, pct, `/homes/${home.id}`, [
      `A new Hush Home has just gone live in ${areaShortLabel(home.areaId)} — and it scores ${pct}% against your brief.`,
      `${home.beds} beds · ${home.baths} baths · ${formatPrice(home.price)}.`,
    ]);
    sent += 1;
  }
  return sent;
}

/** A seeker brief has just been signed: tell every seller it matches. */
export async function alertSellersAboutBrief(brief: SeekerBrief): Promise<number> {
  const weights = await matchWeights();
  const position =
    BUYING_POSITIONS.find((p) => p.value === brief.position)?.label ??
    brief.position;
  let sent = 0;
  for (const home of await liveHomes()) {
    if (home.sellerId === brief.userId) continue;
    const seller = await getUser(home.sellerId);
    const min = threshold(seller);
    if (!seller || min <= 0) continue;
    const { pct } = scoreMatch(home, brief, weights);
    if (pct < min) continue;
    const key = `brief-live:${brief.userId}:${home.id}`;
    if (await hasAlerted(seller.id, key)) continue;
    await recordAlert(seller.id, key);
    deliver(seller, pct, `/dashboard`, [
      `A new Quiet Seeker has just registered — and they score ${pct}% against ${home.headline}.`,
      `${position} · budget ${formatBudget(brief.budgetMin, brief.budgetMax)} · looking in ${brief.areas.map(areaShortLabel).join(", ")}. Anonymised until a viewing is booked.`,
    ]);
    sent += 1;
  }
  return sent;
}
