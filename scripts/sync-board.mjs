// npm run sync-board — pull the current project board from Phil's Cowork
// project folder into the repo, so /board-uvy2tlvzvc42 serves the latest
// version. The board is edited OUTSIDE this repo (Claude/Cowork updates the
// file below); this script is the only way it should ever enter the repo.
//
// The file is copied verbatim except for one permitted addition: a robots
// noindex meta tag (the route also sends X-Robots-Tag). Never restyle or
// otherwise edit the board here — it carries the official logo as supplied.

import fs from "node:fs";
import path from "node:path";

const SOURCE =
  "C:\\Users\\phili\\Documents\\Claude\\Projects\\Matchlisted.com\\matchlisted-project-board.html";
const DEST = path.join(
  process.cwd(),
  "src",
  "app",
  "board-uvy2tlvzvc42",
  "board.html",
);

const ROBOTS_TAG = '<meta name="robots" content="noindex, nofollow">';

let html = fs.readFileSync(SOURCE, "utf8");

if (!/<meta[^>]+name=["']robots["']/i.test(html)) {
  if (/<meta charset="utf-8">/i.test(html)) {
    html = html.replace(/<meta charset="utf-8">/i, `$&\n${ROBOTS_TAG}`);
  } else {
    html = html.replace(/<head>/i, `$&\n${ROBOTS_TAG}`);
  }
  if (!html.includes(ROBOTS_TAG)) {
    console.error("Could not inject the robots meta tag — check the board's <head>.");
    process.exit(1);
  }
}

fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, html);

const kb = Math.round(fs.statSync(DEST).size / 1024);
console.log(`Board synced (${kb} KB) -> src/app/board-uvy2tlvzvc42/board.html`);
console.log("Now commit and deploy so Annabelle sees the update:");
console.log("  git add src/app/board-uvy2tlvzvc42/board.html && git commit");
console.log("  npx vercel deploy --prod --yes");
