// Match queries built on the engine: top homes for a seeker, top (anonymised)
// seekers for a home, and detection of fresh ≥90% matches for the
// "It's a match" moment.

import {
  activeBriefs,
  getBrief,
  getUser,
  hasSeenMatch,
  liveHomes,
  matchWeights,
  pushNotification,
  recordSeenMatch,
} from "./db";
import { MATCH_BANDS, scoreMatch, type MatchResult } from "./match";
import { BUYING_POSITIONS, type HushHome, type SeekerBrief } from "./types";

export interface HomeMatch {
  home: HushHome;
  result: MatchResult;
}

export interface SeekerMatch {
  /** Anonymised for the seller — no name or contact details. */
  seekerId: string;
  label: string; // e.g. "Quiet Seeker · cash buyer (nothing to sell)"
  positionLabel: string;
  budgetMin: number;
  budgetMax: number;
  areas: string[];
  result: MatchResult;
}

export function matchesForSeeker(userId: string): HomeMatch[] {
  const brief = getBrief(userId);
  if (!brief || !brief.contract) return [];
  const weights = matchWeights();
  return liveHomes()
    .filter((h) => h.sellerId !== userId) // never match someone to their own home
    .map((home) => ({ home, result: scoreMatch(home, brief, weights) }))
    .sort((a, b) => b.result.pct - a.result.pct);
}

export function matchesForHome(home: HushHome): SeekerMatch[] {
  const weights = matchWeights();
  return activeBriefs()
    .filter((b) => b.userId !== home.sellerId)
    .map((brief) => toSeekerMatch(brief, scoreMatch(home, brief, weights)))
    .sort((a, b) => b.result.pct - a.result.pct);
}

function toSeekerMatch(brief: SeekerBrief, result: MatchResult): SeekerMatch {
  const positionLabel =
    BUYING_POSITIONS.find((p) => p.value === brief.position)?.label ??
    brief.position;
  return {
    seekerId: brief.userId,
    label: `Quiet Seeker · ${positionLabel.toLowerCase()}`,
    positionLabel,
    budgetMin: brief.budgetMin,
    budgetMax: brief.budgetMax,
    areas: brief.areas,
    result,
  };
}

/**
 * Find fresh ≥90% matches for a user (as seeker and as seller), record them
 * as seen, and push "It's a match" notifications to both parties.
 * Returns the fresh matches so the dashboard can throw the celebration.
 */
export function collectFreshHotMatches(userId: string): {
  asSeeker: HomeMatch[];
  asSeller: { home: HushHome; match: SeekerMatch }[];
} {
  const asSeeker: HomeMatch[] = [];
  for (const m of matchesForSeeker(userId)) {
    if (m.result.pct < MATCH_BANDS.hot) break;
    const key = `${m.home.id}:${userId}`;
    if (hasSeenMatch(userId, key)) continue;
    recordSeenMatch(userId, key, m.result.pct);
    asSeeker.push(m);
    // Tell the seller too (once, from their side of the key).
    if (!hasSeenMatch(m.home.sellerId, key)) {
      recordSeenMatch(m.home.sellerId, key, m.result.pct);
      pushNotification({
        userId: m.home.sellerId,
        kind: "match",
        title: `It's a match — ${m.result.pct}%`,
        body: "A registered Quiet Seeker is a strong match with your Hush Home.",
        href: "/dashboard",
      });
    }
  }

  const asSeller: { home: HushHome; match: SeekerMatch }[] = [];
  const user = getUser(userId);
  if (user) {
    for (const home of liveHomes().filter((h) => h.sellerId === userId)) {
      for (const match of matchesForHome(home)) {
        if (match.result.pct < MATCH_BANDS.hot) break;
        const key = `${home.id}:${match.seekerId}`;
        if (hasSeenMatch(userId, key)) continue;
        recordSeenMatch(userId, key, match.result.pct);
        asSeller.push({ home, match });
        if (!hasSeenMatch(match.seekerId, key)) {
          recordSeenMatch(match.seekerId, key, match.result.pct);
          pushNotification({
            userId: match.seekerId,
            kind: "match",
            title: `It's a match — ${match.result.pct}%`,
            body: "A Hush Home matches your brief. This could be the one.",
            href: "/matches",
          });
        }
      }
    }
  }

  return { asSeeker, asSeller };
}
