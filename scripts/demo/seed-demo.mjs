// Demonstration data for the product video (docs/DEMO-VIDEO.md §3 step 2).
//
//   node scripts/demo/seed-demo.mjs            remove any demo data, then insert it
//   node scripts/demo/seed-demo.mjs --clean    remove the demo data only (teardown)
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

import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { fromBrief, fromHome, fromUser } from "../../src/lib/db-mappers.ts";
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

// Eilidh builds her own Quiet Seeker Profile on camera (scene 1), so she
// gets an account and nothing else. Graham's home is seeded live for
// scenes 4-6.
const EILIDH = { key: "eilidh", email: `eilidh@${DOMAIN}`, name: "Eilidh" };
const GRAHAM = { key: "graham", email: `graham@${DOMAIN}`, name: "Graham" };

// Supporting Quiet Seekers, so the Match Report for a four-bed detached
// home in North Berwick at £400k-£600k shows a believable count, and the
// wider East Lothian figure is larger still. Anonymised at source: only
// the headline is ever shown publicly.
const EL = (place) => `east-lothian/${place}`;
const SUPPORTING = [
  { areas: ["north-berwick", "gullane"], min: 450000, max: 600000, beds: 4, types: ["detached"], position: "cash-nothing-to-sell", headline: "Family of five heading for the coast" },
  { areas: ["north-berwick"], min: 400000, max: 550000, beds: 3, types: ["detached", "semi-detached"], position: "mortgage-sold", headline: "Already sold, ready to move by spring" },
  { areas: ["north-berwick", "aberlady"], min: 500000, max: 700000, beds: 4, types: ["detached", "cottage"], position: "cash-after-sale", headline: "Downsizing from the farm, not too far" },
  { areas: ["gullane", "north-berwick", "longniddry"], min: 420000, max: 575000, beds: 3, types: [], position: "mortgage-to-sell", headline: "Two teachers after a garden and a view" },
  { areas: ["north-berwick"], min: 480000, max: 650000, beds: 4, types: ["detached"], position: "cash-nothing-to-sell", headline: "Returning to Scotland after twenty years away" },
  { areas: ["dunbar", "north-berwick"], min: 380000, max: 520000, beds: 3, types: ["detached", "bungalow"], position: "mortgage-sold", headline: "Room for the dog, and the dog's friends" },
  { areas: ["north-berwick", "gullane"], min: 550000, max: 800000, beds: 4, types: ["detached"], position: "cash-nothing-to-sell", headline: "Golfers who never want to drive to the course" },
  { areas: ["aberlady", "gullane"], min: 400000, max: 600000, beds: 3, types: ["detached", "cottage"], position: "first-time-buyer", headline: "Working from home, want to hear the sea" },
  { areas: ["north-berwick"], min: 350000, max: 480000, beds: 3, types: ["semi-detached", "terraced"], position: "mortgage-to-sell", headline: "Near the school, near the high street" },
  { areas: ["haddington", "east-linton"], min: 300000, max: 420000, beds: 3, types: ["cottage", "terraced"], position: "mortgage-to-sell", headline: "Market-town life with a proper butcher" },
  { areas: ["musselburgh", "prestonpans"], min: 220000, max: 320000, beds: 2, types: ["flat", "terraced"], position: "first-time-buyer", headline: "First home, close to the train" },
  { areas: ["dunbar"], min: 260000, max: 360000, beds: 3, types: ["semi-detached"], position: "mortgage-sold", headline: "Swapping the city flat for a back garden" },
];

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

async function addProfile(id, { email, name }) {
  await insert("profiles", { ...fromUser({ id, email, name, createdAt: days(-30) }), created_at: days(-30) });
}

async function seed() {
  for (const s of SUPPORTING) {
    for (const a of s.areas) if (!getArea(EL(a))) throw new Error(`Unknown area ${EL(a)}`);
  }

  // Eilidh: an account and a profile, nothing more.
  const eilidhId = await createAccount(EILIDH);
  await addProfile(eilidhId, EILIDH);

  // Graham and his home, live, Home Report verified, with viewing slots.
  const grahamId = await createAccount(GRAHAM);
  await addProfile(grahamId, GRAHAM);
  const homeId = crypto.randomUUID();
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
      homeReport: { status: "verified", orderedAt: days(-25), uploadedAt: days(-18), verifiedAt: days(-17) },
      contract: sign(GRAHAM.name, CONTRACT_VERSIONS.seller, days(-26)),
      status: "live",
      ownerEstimate: 510000,
      goLiveAt: days(-14),
      expiresAt: days(351),
      approvalStatus: "approved",
      createdAt: days(-27),
    }),
    created_at: days(-27),
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

  // Supporting Quiet Seekers, each a signed, active profile.
  let n = 0;
  for (const s of SUPPORTING) {
    n += 1;
    const person = { email: `seeker${String(n).padStart(2, "0")}@${DOMAIN}`, name: `Demo seeker ${n}` };
    const id = await createAccount(person);
    await addProfile(id, person);
    await insert("seeker_briefs", {
      ...fromBrief({
        userId: id,
        publicRef: `QS-9${String(100 + n)}`,
        headline: s.headline,
        story: "",
        areas: s.areas.map(EL),
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

  return { homeId, seekers: SUPPORTING.length };
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
      console.log(`Seeded Eilidh, Graham (home ${made.homeId}, live, 4 viewing slots) and ${made.seekers} supporting Quiet Seekers.`);
      console.log(`Sign in as eilidh@${DOMAIN} or graham@${DOMAIN} with DEMO_PASSWORD from .env.demo.`);
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
