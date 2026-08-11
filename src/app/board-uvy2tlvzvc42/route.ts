// The internal project board, served for Annabelle at an unguessable path.
// It contains commercially sensitive material (investor pitch status, cash
// figures), so it is deliberately: noindexed (header + meta), absent from
// robots.txt (listing it there would advertise the path), never linked from
// any page, nav, sitemap or OG surface, and uncached. It serves board.html
// (updated only via `npm run sync-board`) verbatim and touches no listing
// data, so the §3 legal gate is not in play — see the allowlist entry in
// legal-gate.test.ts.

import fs from "node:fs";
import path from "node:path";

export async function GET() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "board-uvy2tlvzvc42", "board.html"),
    "utf8",
  );
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "private, no-store",
    },
  });
}
