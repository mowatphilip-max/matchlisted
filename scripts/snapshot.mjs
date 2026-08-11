// Dump every table in the public schema to JSON — a data snapshot taken
// before risky migrations (pg_dump isn't installed on this machine).
//
//   node scripts/snapshot.mjs <output-directory>
//
// Restores are manual and deliberate: the schema is reproducible from the
// migration files; this preserves the DATA so a bad migration can be rolled
// back by rebuilding the schema and re-inserting these rows.
//
// The output contains personal data (names, emails, addresses). Write it
// OUTSIDE the repo — never to a path that gets committed or pushed.

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}

const outDir = process.argv[2];
if (!outDir) {
  console.error("Usage: node scripts/snapshot.mjs <output-directory>");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const { rows: tables } = await client.query(`
  select table_name from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
  order by table_name
`);

const manifest = { takenAt: new Date().toISOString(), tables: {} };
for (const { table_name } of tables) {
  const { rows } = await client.query(`select * from "${table_name}"`);
  fs.writeFileSync(
    path.join(outDir, `${table_name}.json`),
    JSON.stringify(rows, null, 1),
  );
  manifest.tables[table_name] = rows.length;
  console.log(`${table_name.padEnd(24)} ${rows.length} rows`);
}
fs.writeFileSync(
  path.join(outDir, "_manifest.json"),
  JSON.stringify(manifest, null, 2),
);

console.log(`\nSnapshot written to ${path.resolve(outDir)}`);
await client.end();
