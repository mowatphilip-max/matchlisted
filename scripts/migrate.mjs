// Run the SQL migrations in supabase/migrations against DATABASE_URL.
//
// Each file runs inside a transaction and is recorded in a _migrations
// table, so re-running is safe: already-applied files are skipped.
//
//   node scripts/migrate.mjs          apply pending migrations
//   node scripts/migrate.mjs --status show what's applied vs pending

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

// Load .env.local without adding a dependency.
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}

const DIR = "supabase/migrations";
const statusOnly = process.argv.includes("--status");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(`
  create table if not exists _migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  )
`);

const applied = new Set(
  (await client.query("select filename from _migrations")).rows.map(
    (r) => r.filename,
  ),
);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();

if (statusOnly) {
  for (const f of files) {
    console.log(`${applied.has(f) ? "applied " : "PENDING "} ${f}`);
  }
  await client.end();
  process.exit(0);
}

let ran = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip    ${file} (already applied)`);
    continue;
  }
  const sql = fs.readFileSync(path.join(DIR, file), "utf8");
  process.stdout.write(`apply   ${file} ... `);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into _migrations (filename) values ($1)", [file]);
    await client.query("commit");
    console.log("OK");
    ran += 1;
  } catch (err) {
    await client.query("rollback");
    console.log("FAILED");
    console.error(`\n${file} failed, nothing from it was applied:\n${err.message}\n`);
    await client.end();
    process.exit(1);
  }
}

console.log(ran === 0 ? "\nNothing to do — database is up to date." : `\n${ran} migration(s) applied.`);
await client.end();
