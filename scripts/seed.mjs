// Load the bundled demo data into Supabase so the app and the admin back
// office have something real to show.
//
//   node scripts/seed.mjs           reset the demo data, then insert it
//   node scripts/seed.mjs --clean   remove the demo data, insert nothing
//   node scripts/seed.mjs --status  count what is currently there
//
// Every demo account uses an @demo.matchlisted.com address, and that address
// is the ONLY thing the teardown matches on. Real accounts are never touched.
//
// By default the demo accounts are created without a password, so they hold
// data but cannot be signed into. To walk through the seeker and seller side
// as well, give them one:
//
//   SEED_PASSWORD="a phrase you choose" node scripts/seed.mjs
//
// Matches are not seeded because they are not stored: the Matchlist scores
// every home against every brief on the fly, so seeding homes and briefs is
// what makes matches appear.

import fs from "node:fs";
import crypto from "node:crypto";
import pg from "pg";
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
} from "../src/lib/sample-data.ts";
import {
  fromBrief,
  fromHome,
  fromIntroduction,
  fromInvoice,
  fromPurchaseOrder,
  fromUser,
} from "../src/lib/db-mappers.ts";
import { HOME_REPORT_MARGIN } from "../src/lib/site.ts";

const DEMO_DOMAIN = "demo.matchlisted.com";

// Load .env.local without adding a dependency (same approach as migrate.mjs).
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
const SEED_PASSWORD = process.env.SEED_PASSWORD || null;

if (!SUPABASE_URL || !SERVICE_KEY || !process.env.DATABASE_URL) {
  console.error(
    "Missing config. .env.local needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and DATABASE_URL.",
  );
  process.exit(1);
}

const mode = process.argv.includes("--clean")
  ? "clean"
  : process.argv.includes("--status")
    ? "status"
    : "seed";

// ---- Supabase Auth admin API ----------------------------------------------

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
  if (!res.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${path} returned ${res.status}: ${await res.text()}`,
    );
  }
  return res.status === 204 ? null : res.json();
}

/** Every auth account on the demo domain, across all pages. */
async function demoAuthUsers() {
  const found = [];
  for (let page = 1; ; page++) {
    const body = await admin(`/admin/users?page=${page}&per_page=200`);
    const users = body.users ?? [];
    found.push(...users.filter((u) => (u.email ?? "").endsWith(`@${DEMO_DOMAIN}`)));
    if (users.length < 200) return found;
  }
}

// ---- Small helpers ---------------------------------------------------------

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function insert(table, row) {
  const cols = Object.keys(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  await client.query(
    `insert into ${table} (${cols.map((c) => `"${c}"`).join(", ")}) values (${placeholders})`,
    cols.map((c) => row[c]),
  );
}

async function count(table, where = "", params = []) {
  const { rows } = await client.query(
    `select count(*)::int as n from ${table} ${where}`,
    params,
  );
  return rows[0].n;
}

// ---- Teardown --------------------------------------------------------------

async function clean() {
  const { rows } = await client.query(
    `select id from profiles where email ilike $1`,
    [`%@${DEMO_DOMAIN}`],
  );
  const ids = rows.map((r) => r.id);

  if (ids.length) {
    // purchase_orders holds "on delete restrict" against both homes and
    // profiles, so it would block the cascade. Unhook and remove it first.
    await client.query(
      `update hush_homes set home_report_po_id = null where seller_id = any($1::uuid[])`,
      [ids],
    );
    await client.query(
      `delete from purchase_orders where seller_id = any($1::uuid[])`,
      [ids],
    );
    // charges restricts on the payer too (an obligation must never vanish
    // by accident) — demo charges are removed deliberately here.
    await client.query(
      `delete from charges where payer_user_id = any($1::uuid[])`,
      [ids],
    );
  }

  // Deleting the auth account cascades to the profile, and from there to
  // briefs, homes, viewings, offers, invoices, saved homes and notifications.
  const authUsers = await demoAuthUsers();
  for (const u of authUsers) {
    await admin(`/admin/users/${u.id}`, { method: "DELETE" });
  }

  // Any profile whose auth account had already gone.
  await client.query(`delete from profiles where email ilike $1`, [
    `%@${DEMO_DOMAIN}`,
  ]);

  // The conveyancing panel is reference data rather than a person, so it is
  // matched by firm name instead. Offers referencing them are gone by now.
  await client.query(`delete from lawyers where firm = any($1::text[])`, [
    sampleLawyers.map((l) => l.firm),
  ]);

  return { accounts: authUsers.length, profiles: ids.length };
}

// ---- Seed ------------------------------------------------------------------

async function seed() {
  // One id map for everything, filled before any insert, so a row can point
  // at another row regardless of the order they go in.
  const id = new Map();
  const uuid = (key) => {
    if (!id.has(key)) id.set(key, crypto.randomUUID());
    return id.get(key);
  };

  // 1. Auth accounts. Confirmed on creation, so no email is ever sent.
  for (const u of sampleUsers) {
    const created = await admin("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: u.email,
        email_confirm: true,
        user_metadata: { name: u.name, demo: true },
        ...(SEED_PASSWORD ? { password: SEED_PASSWORD } : {}),
      }),
    });
    id.set(u.id, created.id);
  }

  // 2. Profiles.
  for (const u of sampleUsers) {
    await insert("profiles", {
      ...fromUser({ ...u, id: uuid(u.id) }),
      created_at: u.createdAt,
    });
  }

  // 3. Conveyancing panel.
  for (const l of sampleLawyers) {
    await insert("lawyers", {
      id: uuid(l.id),
      firm: l.firm,
      contact_name: l.contactName,
      location: l.location,
      fee_estimate: l.feeEstimate,
      blurb: l.blurb ?? "",
    });
  }

  // 4. Quiet Seeker briefs.
  for (const b of sampleBriefs) {
    await insert("seeker_briefs", {
      ...fromBrief({ ...b, userId: uuid(b.userId) }),
      created_at: b.createdAt,
    });
  }

  // 5. Hush Homes. report_invoice_id is a plain column rather than a foreign
  //    key, so it can be filled before the invoices themselves exist.
  for (const h of sampleHomes) {
    await insert("hush_homes", {
      ...fromHome({
        ...h,
        id: uuid(h.id),
        sellerId: uuid(h.sellerId),
        homeReport: {
          ...h.homeReport,
          invoiceId: h.homeReport.invoiceId ? uuid(h.homeReport.invoiceId) : undefined,
          poId: undefined, // linked after the purchase orders are raised
        },
      }),
      created_at: h.createdAt,
    });
  }

  // 6. Viewing diary and any booked viewings.
  for (const s of sampleSlots) {
    await insert("viewing_slots", {
      id: uuid(s.id),
      home_id: uuid(s.homeId),
      starts_at: s.start,
      ends_at: s.end,
      booked_by: s.bookedBy ? uuid(s.bookedBy) : null,
    });
  }
  for (const v of sampleViewings) {
    await insert("viewings", {
      id: uuid(v.id),
      home_id: uuid(v.homeId),
      seeker_id: uuid(v.seekerId),
      slot_id: uuid(v.slotId),
      starts_at: v.start,
      ends_at: v.end,
      status: v.status,
      feedback: v.feedback ?? null,
      still_interested: v.stillInterested ?? null,
    });
  }

  // 7. Offers. history is jsonb, so it must be stringified rather than handed
  //    over as a JS array, which the driver would send as a Postgres array.
  for (const o of sampleOffers) {
    await insert("offers", {
      id: uuid(o.id),
      home_id: uuid(o.homeId),
      seeker_id: uuid(o.seekerId),
      lawyer_id: uuid(o.lawyerId),
      amount: o.amount,
      note: o.note ?? null,
      status: o.status,
      counter_amount: o.counterAmount ?? null,
      history: JSON.stringify(o.history ?? []),
      missives_concluded_at: o.missivesConcludedAt ?? null,
      created_at: o.createdAt,
    });
  }

  // 8. Invoices — deferred-fee model: NO upfront Home Report invoices (the
  //    obligation lives in the charges ledger instead). Deposits and the
  //    fixed £300 buyer fee stay.
  for (const inv of sampleInvoices.filter((i) => i.kind !== "home-report")) {
    await insert("invoices", {
      ...fromInvoice({
        ...inv,
        id: uuid(inv.id),
        userId: uuid(inv.userId),
        homeId: inv.homeId ? uuid(inv.homeId) : undefined,
        offerId: inv.offerId ? uuid(inv.offerId) : undefined,
        lawyerId: inv.lawyerId ? uuid(inv.lawyerId) : undefined,
      }),
      created_at: inv.createdAt,
    });
  }

  // 9. Purchase orders, so the admin Orders screen has a surveyor pipeline.
  //    One per instructed Home Report, numbered from the real sequence so
  //    the demo can never hand a surveyor a number the app later reuses.
  //    New-model figures: the owner owes £580 inc VAT, deferred; our margin
  //    £100; the surveyor bills us the rest.
  const HR_GROSS = 580;
  const HR_NET = Math.round((HR_GROSS / 1.2) * 100) / 100; // 483.33
  const HR_VAT = Math.round((HR_GROSS - HR_NET) * 100) / 100; // 96.67
  let orders = 0;
  for (const home of sampleHomes) {
    if (!home.homeReport.supplier) continue;
    const { rows } = await client.query(`select next_purchase_order_ref() as ref`);
    const verified = home.homeReport.status === "verified";
    await insert(
      "purchase_orders",
      fromPurchaseOrder({
        id: rows[0].ref,
        homeId: uuid(home.id),
        sellerId: uuid(home.sellerId),
        supplier: home.homeReport.supplier,
        estimatedValue: home.price,
        base: Math.round((HR_NET - HOME_REPORT_MARGIN) * 100) / 100,
        vat: HR_VAT,
        margin: HOME_REPORT_MARGIN,
        total: HR_GROSS,
        invoiceId: undefined,
        status: verified ? "settled" : "instructed",
        billedAt: verified ? home.homeReport.uploadedAt : undefined,
        settledAt: verified ? home.homeReport.verifiedAt : undefined,
      }),
    );
    await client.query(
      `update hush_homes set home_report_po_id = $1 where id = $2`,
      [rows[0].ref, uuid(home.id)],
    );
    orders++;
  }

  // 9b. The charges ledger (deferred-fee model): every ordered Home Report
  //     is a pending £580 obligation; the sold home's charges have fired via
  //     missives_concluded and route to the solicitor's mandate, alongside
  //     the fixed £300 + VAT buyer fee.
  let charges = 0;
  for (const home of sampleHomes) {
    if (!home.homeReport.supplier) continue;
    const sold = home.status === "sold";
    await insert("charges", {
      id: crypto.randomUUID(),
      subject_type: "listing",
      subject_id: uuid(home.id),
      payer_user_id: uuid(home.sellerId),
      type: "home_report",
      net_amount: HR_NET,
      vat_amount: HR_VAT,
      gross_amount: HR_GROSS,
      status: sold ? "mandated" : "pending",
      trigger: sold ? "missives_concluded" : null,
      due_at: sold ? "2026-06-30T12:00:00Z" : null,
      collection_route: sold ? "solicitor_mandate" : null,
      notes: sold
        ? "Collected by the panel solicitor from proceeds at settlement."
        : "Deferred: payable at settlement, or on withdrawal/longstop.",
    });
    charges++;
  }
  for (const o of sampleOffers.filter((x) => x.missivesConcludedAt)) {
    await insert("charges", {
      id: crypto.randomUUID(),
      subject_type: "transaction",
      subject_id: uuid(o.id),
      payer_user_id: uuid(o.seekerId),
      type: "buyer_fee",
      net_amount: 300,
      vat_amount: 60,
      gross_amount: 360,
      status: "due",
      trigger: "missives_concluded",
      due_at: o.missivesConcludedAt,
      collection_route: "solicitor_mandate",
      notes: "Fixed £300 + VAT, every transaction, regardless of price.",
    });
    charges++;
  }

  // 10. Saved homes and notifications.
  for (const s of sampleSaved) {
    await insert("saved_homes", {
      seeker_id: uuid(s.seekerId),
      home_id: uuid(s.homeId),
      saved_at: s.savedAt,
    });
  }
  for (const n of sampleNotifications) {
    await insert("notifications", {
      id: uuid(n.id),
      user_id: uuid(n.userId),
      kind: n.kind,
      title: n.title,
      body: n.body,
      // hrefs in the sample point at sample ids, so remap the home ones.
      href: n.href?.startsWith("/homes/")
        ? `/homes/${uuid(n.href.slice("/homes/".length))}`
        : (n.href ?? null),
      created_at: n.createdAt,
      read_at: n.readAt ?? null,
    });
  }

  // 11. Introductions, covering the whole pipeline rather than one status.
  //     A seeker_ref is either a profile id or a 'mowatt:REF' marker for a
  //     seeker who came from the sheets and has no account yet.
  const intros = [
    ...sampleIntroductions.map((i) => ({
      ...i,
      id: uuid(i.id),
      seekerId: uuid(i.seekerId),
      sellerId: uuid(i.sellerId),
      homeId: i.homeId ? uuid(i.homeId) : null,
    })),
    {
      id: uuid("intro-mowatt-gullane"),
      seekerId: "mowatt:QS-20253",
      sellerId: uuid("u-gordon"),
      homeId: uuid("h-gullane"),
      status: "offered",
      createdAt: "2026-07-18T11:00:00Z",
      offeredAt: "2026-07-19T09:15:00Z",
    },
    {
      id: uuid("intro-freya-stockbridge"),
      seekerId: uuid("u-freya"),
      sellerId: uuid("u-ewan"),
      homeId: uuid("h-stockbridge"),
      status: "accepted",
      createdAt: "2026-07-09T16:20:00Z",
      offeredAt: "2026-07-10T08:40:00Z",
      respondedAt: "2026-07-10T19:05:00Z",
    },
  ];
  for (const i of intros) {
    await insert("introductions", {
      ...fromIntroduction(i),
      created_at: i.createdAt,
    });
  }

  return {
    accounts: sampleUsers.length,
    homes: sampleHomes.length,
    briefs: sampleBriefs.length,
    introductions: intros.length,
    invoices: sampleInvoices.filter((i) => i.kind !== "home-report").length,
    orders,
    charges,
  };
}

// ---- Run -------------------------------------------------------------------

await client.connect();

try {
  if (mode === "status") {
    const demo = await count("profiles", "where email ilike $1", [`%@${DEMO_DOMAIN}`]);
    console.log(`demo accounts:  ${demo}`);
    console.log(`profiles:       ${await count("profiles")} (all)`);
    console.log(`hush_homes:     ${await count("hush_homes")}`);
    console.log(`seeker_briefs:  ${await count("seeker_briefs")}`);
    console.log(`introductions:  ${await count("introductions")}`);
    console.log(`invoices:       ${await count("invoices")}`);
    console.log(`purchase_orders:${await count("purchase_orders")}`);
    console.log(`charges:        ${await count("charges")}`);
  } else {
    const removed = await clean();
    if (removed.accounts || removed.profiles) {
      console.log(`Removed ${removed.accounts} existing demo account(s).`);
    }

    if (mode === "clean") {
      console.log("Demo data cleared. Real accounts untouched.");
    } else {
      const made = await seed();
      console.log(
        `Seeded ${made.accounts} accounts, ${made.homes} homes, ${made.briefs} briefs, ` +
          `${made.introductions} introductions, ${made.invoices} invoices, ` +
          `${made.orders} purchase orders, ${made.charges} deferred charges.`,
      );
      console.log(
        SEED_PASSWORD
          ? `Demo accounts can sign in with the password you supplied, for example ${sampleUsers[1].email}.`
          : "Demo accounts have no password and cannot be signed into. Re-run with SEED_PASSWORD set if you want to tour the seeker and seller side.",
      );
      console.log("Undo at any time with: node scripts/seed.mjs --clean");
    }
  }
} catch (err) {
  console.error("\nFailed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
