// Demonstration data for the product video (docs/DEMO-VIDEO.md §3 step 2).
//
//   node scripts/demo/seed-demo.mjs --stage before   scenes 1-3 (see below)
//   node scripts/demo/seed-demo.mjs --stage after    scenes 4-6 (the default)
//   node scripts/demo/seed-demo.mjs --stage live     showing the site, not filming
//   node scripts/demo/seed-demo.mjs --clean          remove the demo data only (teardown)
//   node scripts/demo/seed-demo.mjs --status   count what is there
//
// LOCAL DATABASE ONLY. Reads .env.demo (never .env.local) and refuses to run
// unless the API and database are on 127.0.0.1. Unlike scripts/seed.mjs it
// does not touch the sample data, so nothing in sample-data.ts appears here.
//
// Every account is on @example.com and carries user_metadata.demo = true;
// teardown matches on that domain only. Names are first names only, the
// address is plainly fictional, and no Mowatt seeker is involved (the app
// runs with MATCHLISTED_DEMO=1, which stops the sheets being read).
//
// Idempotent: each run tears down the previous demo data first.
//
// Two stages, because the storyboard has Eilidh and Graham build their own
// profile and listing on camera (scenes 1 and 3) and then needs both to exist
// for scenes 4-6:
//
//   before  Eilidh and Graham are accounts only. Everyone else is seeded.
//   after   Eilidh's Quiet Seeker Profile is signed, with her scene 1 answers.
//           Graham's home is complete with its Home Report UPLOADED and
//           awaiting verification. Sign in as admin@example.com and verify it
//           in /admin/reports: the app itself makes the home live, alerts
//           Eilidh ("You have a possible match") and tells Graham the report is
//           verified. No notification is ever written by this script
//           (DEMO-VIDEO.md rule 1: no fake notification for the camera).
//   live    As after, but Graham's home is already live with its report
//           verified, so it shows on /hush-homes straight away. Because no
//           app action made it live, nobody has been sent a match alert:
//           use it to show the site in person, never to film scene 4.

import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { fromBrief, fromHome, fromUser } from "../../src/lib/db-mappers.ts";
import { DEMO_HOMES, DEMO_SEEKERS } from "../../src/lib/demo-data.ts";
import { getArea } from "../../src/lib/areas.ts";
import { CONTRACT_VERSIONS } from "../../src/lib/site.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const DOMAIN = "example.com";
const LOCAL = /^(https?|postgres(ql)?):\/\/([^@/]*@)?127\.0\.0\.1[:/]/;

const env = {};
for (const line of readFileSync(resolve(ROOT, ".env.demo"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SECRET_KEY;
const DATABASE_URL = env.DATABASE_URL;
const PASSWORD = env.DEMO_PASSWORD;

for (const [k, v] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, DATABASE_URL })) {
  if (!LOCAL.test(v ?? "")) {
    console.error(`Refusing: ${k} in .env.demo is not on 127.0.0.1 (${v || "unset"}).`);
    process.exit(1);
  }
}
if (!SERVICE_KEY || !PASSWORD) {
  console.error("Missing SUPABASE_SECRET_KEY or DEMO_PASSWORD in .env.demo. Run npm run demo:db first.");
  process.exit(1);
}
console.log(`Demo database: ${SUPABASE_URL}`);

const stageArg = process.argv[process.argv.indexOf("--stage") + 1];
const STAGE = process.argv.includes("--stage") ? stageArg : "after";
if (!["before", "after", "live"].includes(STAGE)) {
  console.error(`Unknown --stage "${stageArg}". Use before, after or live.`);
  process.exit(1);
}

const mode = process.argv.includes("--clean")
  ? "clean"
  : process.argv.includes("--status")
    ? "status"
    : "seed";

// ---- The cast ----------------------------------------------------------------

const NOW = new Date();
const days = (n) => new Date(NOW.getTime() + n * 86_400_000).toISOString();
const at = (dayOffset, hour) => {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};
const sign = (typedName, version, signedAt = days(-20)) => ({
  typedName,
  signedAt,
  ip: "127.0.0.1",
  version,
});

const EILIDH = { key: "eilidh", email: `eilidh@${DOMAIN}`, name: "Eilidh" };
const GRAHAM = { key: "graham", email: `graham@${DOMAIN}`, name: "Graham" };
// Verifies Graham's Home Report in the after stage. Admin screens are never
// filmed.
const ADMIN = { key: "admin", email: `admin@${DOMAIN}`, name: "Demo admin", isAdmin: true };

// What Eilidh enters on camera in scene 1 (DEMO-VIDEO.md §2), so the after
// stage continues from exactly where scene 1 left off.
const EILIDH_PROFILE = {
  publicRef: "QS-9001",
  headline: "A family home within walking distance of the beach",
  areas: ["east-lothian/north-berwick", "east-lothian/gullane"],
  budgetMin: 400000,
  budgetMax: 525000,
  minBeds: 3,
  position: "mortgage-sold",
  notes: "South-facing garden, walk to the beach.",
};

// Supporting Quiet Seekers and the additional live homes now live in
// src/lib/demo-data.ts, so the "Who's looking" directory (lib/mowatt-seekers.ts)
// serves exactly the buyers seeded here. The first twelve are the original
// cast: the Match Report for Graham's four-bed detached North Berwick home at
// £400k-£600k counts on them, so their order and figures must not change.
const EL = (place) => `east-lothian/${place}`;

// ---- Supabase Auth admin API ---------------------------------------------------

async function admin(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} returned ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function demoAuthUsers() {
  const found = [];
  for (let page = 1; ; page++) {
    const body = await admin(`/admin/users?page=${page}&per_page=200`);
    const users = body.users ?? [];
    found.push(...users.filter((u) => (u.email ?? "").endsWith(`@${DOMAIN}`)));
    if (users.length < 200) return found;
  }
}

async function createAccount({ email, name }) {
  const created = await admin("/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name, demo: true },
    }),
  });
  return created.id;
}

// ---- Database -------------------------------------------------------------------

const client = new pg.Client({ connectionString: DATABASE_URL });

async function insert(table, row) {
  const cols = Object.keys(row);
  await client.query(
    `insert into ${table} (${cols.map((c) => `"${c}"`).join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
    cols.map((c) => row[c]),
  );
}

async function clean() {
  const { rows } = await client.query(`select id from profiles where email ilike $1`, [`%@${DOMAIN}`]);
  const ids = rows.map((r) => r.id);
  if (ids.length) {
    await client.query(`update hush_homes set home_report_po_id = null where seller_id = any($1::uuid[])`, [ids]);
    await client.query(`delete from purchase_orders where seller_id = any($1::uuid[])`, [ids]);
    await client.query(`delete from charges where payer_user_id = any($1::uuid[])`, [ids]);
  }
  const accounts = await demoAuthUsers();
  for (const u of accounts) await admin(`/admin/users/${u.id}`, { method: "DELETE" });
  await client.query(`delete from profiles where email ilike $1`, [`%@${DOMAIN}`]);
  return accounts.length;
}

async function addProfile(id, { email, name, isAdmin = false }) {
  await insert("profiles", { ...fromUser({ id, email, name, isAdmin, createdAt: days(-30) }), created_at: days(-30) });
}

async function seed() {
  // Fail before writing anything if any demo row points at an unknown area.
  for (const s of DEMO_SEEKERS) {
    for (const a of s.areas) if (!getArea(a)) throw new Error(`Unknown area ${a}`);
  }
  for (const h of DEMO_HOMES) {
    if (!getArea(h.areaId)) throw new Error(`Unknown area ${h.areaId}`);
  }

  for (const person of [EILIDH, GRAHAM, ADMIN]) {
    person.id = await createAccount(person);
    await addProfile(person.id, person);
  }
  const eilidhId = EILIDH.id;
  const grahamId = GRAHAM.id;

  const homeId = STAGE === "before" ? null : crypto.randomUUID();
  const live = STAGE === "live";
  if (STAGE !== "before") {
    // Eilidh's signed Quiet Seeker Profile, as she built it in scene 1.
    await insert("seeker_briefs", {
      ...fromBrief({
        userId: eilidhId,
        publicRef: EILIDH_PROFILE.publicRef,
        headline: EILIDH_PROFILE.headline,
        story: "",
        areas: EILIDH_PROFILE.areas,
        budgetMin: EILIDH_PROFILE.budgetMin,
        budgetMax: EILIDH_PROFILE.budgetMax,
        minBeds: EILIDH_PROFILE.minBeds,
        minBaths: 1,
        garden: "must-have",
        types: [],
        features: [],
        position: EILIDH_PROFILE.position,
        notes: EILIDH_PROFILE.notes,
        contract: sign(EILIDH.name, CONTRACT_VERSIONS.seeker, days(-2)),
        createdAt: days(-2),
        updatedAt: days(-2),
      }),
      created_at: days(-2),
    });

    // Graham's home as he built it in scene 3, Home Report uploaded and
    // awaiting verification. Going live is left to the app (see header).
    await insert("hush_homes", {
      ...fromHome({
        id: homeId,
        sellerId: grahamId,
        headline: "Four-bed family home, five minutes from the beach",
        areaId: EL("north-berwick"),
        addressLine: "1 Demonstration Road, North Berwick",
        price: 495000,
        beds: 4,
        baths: 2,
        type: "detached",
        garden: true,
        features: ["parking", "home-office"],
        description:
          "A detached family home with a south-facing garden, a short walk from the beach and the high street. Demonstration listing.",
        photos: [],
        floorPlan: null,
        homeReport: {
          status: live ? "verified" : "uploaded",
          orderedAt: days(-9),
          fileName: "home-report-demonstration.pdf",
          uploadedAt: days(-1),
          ...(live ? { verifiedAt: days(-1) } : {}),
        },
        contract: sign(GRAHAM.name, CONTRACT_VERSIONS.seller, days(-10)),
        status: live ? "live" : "pending-approval",
        ownerEstimate: 510000,
        ...(live ? { goLiveAt: days(-1), expiresAt: days(364) } : {}),
        approvalStatus: "approved",
        createdAt: days(-10),
      }),
      created_at: days(-10),
    });
    for (const [d, h] of [[3, 10], [3, 14], [5, 11], [6, 16]]) {
      await insert("viewing_slots", {
        id: crypto.randomUUID(),
        home_id: homeId,
        starts_at: at(d, h),
        ends_at: at(d, h + 1),
        booked_by: null,
      });
    }
  }

  // Additional live homes, so the site has more than one listing to browse.
  // Each gets its own fictional seller account and is seeded exactly like
  // Graham's: signed, Home Report verified, approved and live. No photos, so
  // no real listing image can appear on screen (DEMO-VIDEO.md rule 3).
  let homeCount = 0;
  for (const [i, h] of DEMO_HOMES.entries()) {
    const person = { email: `${h.seller}@${DOMAIN}`, name: h.sellerName };
    const sellerId = await createAccount(person);
    await addProfile(sellerId, person);
    // Stagger ages so the listings don't all read as created the same day.
    const age = -60 + i * 4;
    await insert("hush_homes", {
      ...fromHome({
        id: crypto.randomUUID(),
        sellerId,
        headline: h.headline,
        areaId: h.areaId,
        addressLine: h.addressLine,
        price: h.price,
        beds: h.beds,
        baths: h.baths,
        type: h.type,
        garden: h.garden,
        features: h.features,
        description: h.description,
        photos: [],
        floorPlan: null,
        homeReport: { status: "verified", orderedAt: days(age + 2), uploadedAt: days(age + 7), verifiedAt: days(age + 8) },
        contract: sign(person.name, CONTRACT_VERSIONS.seller, days(age + 1)),
        status: "live",
        ownerEstimate: h.price,
        goLiveAt: days(age + 10),
        expiresAt: days(age + 375),
        approvalStatus: "approved",
        createdAt: days(age),
      }),
      created_at: days(age),
    });
    homeCount += 1;
  }

  // Supporting Quiet Seekers, each a signed, active profile.
  let n = 0;
  for (const s of DEMO_SEEKERS) {
    n += 1;
    const person = { email: `seeker${String(n).padStart(2, "0")}@${DOMAIN}`, name: `Demo seeker ${n}` };
    const id = await createAccount(person);
    await addProfile(id, person);
    await insert("seeker_briefs", {
      ...fromBrief({
        userId: id,
        publicRef: `QS-9${String(100 + n)}`,
        headline: s.headline,
        // Was "", which left every seeker profile page with an empty story.
        story: s.story,
        areas: s.areas,
        budgetMin: s.min,
        budgetMax: s.max,
        minBeds: s.beds,
        minBaths: 1,
        garden: "nice-to-have",
        types: s.types,
        features: [],
        position: s.position,
        contract: sign(person.name, CONTRACT_VERSIONS.seeker, days(-40 + n)),
        createdAt: days(-40 + n),
        updatedAt: days(-40 + n),
      }),
      created_at: days(-40 + n),
    });
  }

  return { homeId, homes: homeCount, seekers: DEMO_SEEKERS.length };
}

// ---- Run --------------------------------------------------------------------------

await client.connect();
try {
  if (mode === "status") {
    const q = async (sql, p = []) => (await client.query(sql, p)).rows[0].n;
    console.log(`demo accounts: ${await q(`select count(*)::int n from profiles where email ilike $1`, [`%@${DOMAIN}`])}`);
    console.log(`all profiles:  ${await q(`select count(*)::int n from profiles`)}`);
    console.log(`hush_homes:    ${await q(`select count(*)::int n from hush_homes`)}`);
    console.log(`briefs:        ${await q(`select count(*)::int n from seeker_briefs`)}`);
  } else {
    const removed = await clean();
    if (removed) console.log(`Removed ${removed} demo account(s).`);
    if (mode === "seed") {
      const made = await seed();
      console.log(`Stage "${STAGE}": ${made.homes} other live homes and ${made.seekers} supporting Quiet Seekers.`);
      if (STAGE === "before") {
        console.log("Eilidh and Graham are accounts only, ready to build their profile and listing on camera (scenes 1 and 3).");
      } else if (STAGE === "live") {
        console.log(`Eilidh's profile is signed. Graham's home (${made.homeId}) is live. No match alerts have been sent: do not film scene 4 from this stage.`);
      } else {
        console.log(`Eilidh's profile is signed. Graham's home (${made.homeId}) is waiting for its Home Report to be verified.`);
        console.log(`Next: sign in as admin@${DOMAIN}, open /admin/reports and verify it. The app makes it live and sends the match alerts.`);
      }
      console.log(`Sign in as eilidh@, graham@ or admin@${DOMAIN} with DEMO_PASSWORD from .env.demo.`);
    } else {
      console.log("Demo data removed.");
    }
  }
} catch (err) {
  console.error("\nFailed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
