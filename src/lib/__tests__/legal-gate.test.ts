// THE LEGAL GATE (docs/BUILD-BRIEF.md §3, Housing (Scotland) Act 2006
// ss.98/101): a listing without a verified Home Report must be invisible to
// every user except its owner and admins, across every read path.
//
// This test runs against the real dev Supabase project (.env.local). It
// creates its own fixtures — a seller, a seeker with a signed brief, and a
// pre-live ("shadow") home rigged to be as tempting as possible to leak
// (contract signed, preview_listed true, a perfect match for the seeker's
// brief) — then asserts every seeker-facing read refuses to show it.
// Fixtures use @demo.matchlisted.com addresses, so scripts/seed.mjs --clean
// sweeps any strays if a run dies mid-way.

import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  allEmails,
  createProfile,
  getHomeFor,
  liveHomes,
  notificationsForUser,
  upsertBrief,
  upsertHome,
  upsertIntroduction,
  newId,
  PUBLIC_HOME_STATUSES,
} from "../db";
import { alertSeekersAboutHome, alertSellersAboutBrief } from "../alerts";
import { matchesForSeeker } from "../matches";
import { matchlistPulse } from "../pulse";
import type { HushHome, SeekerBrief } from "../types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

async function adminAuth(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`auth ${path}: ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

const run = Date.now();
const sellerEmail = `test-gate-seller-${run}@demo.matchlisted.com`;
const seekerEmail = `test-gate-seeker-${run}@demo.matchlisted.com`;

let sellerId: string;
let seekerId: string;
let homeId: string;
const authIds: string[] = [];

const sig = {
  typedName: "Legal Gate Test",
  signedAt: new Date().toISOString(),
  ip: "test",
  version: "seller-v1.0-2026-07",
};

beforeAll(async () => {
  for (const email of [sellerEmail, seekerEmail]) {
    const created = await adminAuth("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        email_confirm: true,
        user_metadata: { demo: true, test: "legal-gate" },
      }),
    });
    authIds.push(created.id);
  }
  [sellerId, seekerId] = authIds;
  await createProfile({ id: sellerId, name: "Gate Test Seller", email: sellerEmail });
  await createProfile({ id: seekerId, name: "Gate Test Seeker", email: seekerEmail });

  // A registered seeker whose brief the shadow home matches perfectly:
  // if anything leaks, this brief will surface it.
  const brief: SeekerBrief = {
    userId: seekerId,
    publicRef: `QS-TEST-${run}`,
    headline: "Legal-gate test brief",
    story: "Test fixture — should never be public.",
    areas: ["east-lothian/gullane"],
    budgetMin: 800000,
    budgetMax: 900000,
    minBeds: 4,
    minBaths: 2,
    garden: "must-have",
    types: ["detached"],
    features: [],
    position: "cash-nothing-to-sell",
    contract: { ...sig, version: "seeker-v1.0-2026-07" },
    propertyTypes: [],
    readiness: [],
    vetted: false,
    budgetRangeMin: null,
    budgetRangeMax: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await upsertBrief(brief);

  // The shadow home: draft status but rigged with every attribute that has
  // ever leaked a listing — signed contract, preview flag, perfect match.
  homeId = newId();
  const home: HushHome = {
    id: homeId,
    sellerId,
    headline: `Legal-gate shadow home ${run}`,
    areaId: "east-lothian/gullane",
    addressLine: "1 Test Street, Gullane",
    price: 850000,
    beds: 4,
    baths: 3,
    type: "detached",
    garden: true,
    features: [],
    description: "Pre-live fixture. If a seeker can read this, §3 is broken.",
    photos: [],
    floorPlan: null,
    homeReport: { status: "none" },
    contract: sig,
    status: "draft",
    previewListed: true,
    createdAt: new Date().toISOString(),
  };
  await upsertHome(home);
});

afterAll(async () => {
  // Deleting the auth accounts cascades through profiles to briefs, homes
  // and introductions.
  for (const id of authIds) {
    await adminAuth(`/admin/users/${id}`, { method: "DELETE" });
  }
});

describe("the §3 legal gate", () => {
  it("keeps a shadow home out of the browse scope", async () => {
    const ids = (await liveHomes()).map((h) => h.id);
    expect(ids).not.toContain(homeId);
  });

  it("hides a shadow home from a signed-in registered seeker", async () => {
    expect(await getHomeFor(homeId, { id: seekerId })).toBeUndefined();
  });

  it("hides a shadow home from an anonymous visitor", async () => {
    expect(await getHomeFor(homeId, null)).toBeUndefined();
  });

  it("shows the owner their own shadow home", async () => {
    const home = await getHomeFor(homeId, { id: sellerId });
    expect(home?.id).toBe(homeId);
  });

  it("shows an admin the shadow home", async () => {
    const home = await getHomeFor(homeId, { id: "any", isAdmin: true });
    expect(home?.id).toBe(homeId);
  });

  it("keeps a shadow home out of the seeker's match list, even at 90%+", async () => {
    const matches = await matchesForSeeker(seekerId);
    expect(matches.map((m) => m.home.id)).not.toContain(homeId);
  });

  it("keeps a shadow home out of the public pulse ticker", async () => {
    const events = await matchlistPulse();
    const blob = JSON.stringify(events);
    expect(blob).not.toContain(homeId);
    expect(blob).not.toContain("Legal-gate shadow home");
  });

  it("is not vacuous: the same home becomes visible once live", async () => {
    const asOwner = await getHomeFor(homeId, { id: sellerId });
    await upsertHome({ ...asOwner!, status: "live" });
    try {
      expect((await liveHomes()).map((h) => h.id)).toContain(homeId);
      expect((await getHomeFor(homeId, { id: seekerId }))?.id).toBe(homeId);
    } finally {
      await upsertHome({ ...asOwner!, status: "draft" });
    }
  });

  it("does NOT unlock a pre-live home for an accepted introduction", async () => {
    // s.101(3) catches communication of availability to ANY person, with no
    // consent carve-out. However consented, an introduction cannot open a
    // pre-live home; queued hands fire only at go-live.
    const intro = {
      id: newId(),
      seekerId,
      sellerId,
      homeId,
      status: "accepted" as const,
      createdAt: new Date().toISOString(),
    };
    await upsertIntroduction(intro);
    expect(await getHomeFor(homeId, { id: seekerId })).toBeUndefined();
    expect(await getHomeFor(homeId, null)).toBeUndefined();
  });

  it("alerts nobody when the match-notification job meets a pre-live home", async () => {
    // The highest-risk path: the alert job runs outside every request-scoped
    // guard. It must refuse a pre-live home itself, not trust its caller.
    const shadow = await getHomeFor(homeId, { id: sellerId });
    const sent = await alertSeekersAboutHome(shadow!);
    expect(sent).toBe(0);

    // And the brief-side job scanning homes must never surface it either —
    // our fixture seller would be the recipient if it leaked.
    const before = (await notificationsForUser(sellerId)).length;
    await alertSellersAboutBrief({
      // A brief rigged to score ~perfectly against the shadow home.
      userId: seekerId,
      publicRef: `QS-TEST-JOB-${run}`,
      headline: "job probe",
      story: "",
      areas: ["east-lothian/gullane"],
      budgetMin: 800000,
      budgetMax: 900000,
      minBeds: 4,
      minBaths: 2,
      garden: "must-have",
      types: ["detached"],
      features: [],
      position: "cash-nothing-to-sell",
      contract: { ...sig, version: "seeker-v1.0-2026-07" },
      propertyTypes: [],
      readiness: [],
      vetted: false,
      budgetRangeMin: null,
      budgetRangeMax: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect((await notificationsForUser(sellerId)).length).toBe(before);

    // No email in the outbox may reference the shadow home.
    const emails = await allEmails();
    const blob = JSON.stringify(emails.slice(0, 50));
    expect(blob).not.toContain(homeId);
    expect(blob).not.toContain("Legal-gate shadow home");
  });

  it("has no unreviewed public route surfaces (sitemap, OG, feeds, exports)", () => {
    // Tripwire: every server route is enumerated here. Adding a route file
    // fails this test until the author confirms it respects the §3 scope
    // and adds it to the allowlist.
    const appDir = path.resolve(__dirname, "../../app");
    const found: string[] = [];
    const risky =
      /^(route\.(ts|js)|sitemap\.[a-z]+|opengraph-image\.[a-z]+|twitter-image\.[a-z]+|feed\.[a-z]+|rss\.[a-z]+)$/;
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (risky.test(entry.name)) {
          found.push(path.relative(appDir, p).replace(/\\/g, "/"));
        }
      }
    };
    walk(appDir);
    expect(found.sort()).toEqual([
      // Dev-only seeker mapping (no home data).
      "api/dev/seeker-mapping/route.ts",
      // Stripe ingress (no home data served).
      "api/webhooks/stripe/route.ts",
      // internal project board — static, contains no listing data, noindex,
      // unlinked. Reviewed and approved by Phil 6 Aug 2026.
      "board-uvy2tlvzvc42/route.ts",
      // Home Report download — scoped via getHomeFor + audited.
      "homes/[id]/report/route.ts",
    ]);
    // No sitemap may exist anywhere while pre-live listings exist at all
    // without going through gate review.
    expect(fs.existsSync(path.resolve(appDir, "../../public/sitemap.xml"))).toBe(false);
  });

  it("uses non-enumerable home ids", async () => {
    expect(homeId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("documents the public statuses the scope allows", () => {
    expect(PUBLIC_HOME_STATUSES).toEqual(["live", "under-offer", "sold"]);
  });
});
