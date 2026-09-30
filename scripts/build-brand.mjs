// Builds every Matchlisted logo file from one fixed drawing.
//
//   node scripts/build-brand.mjs      (or: npm run build-brand)
//
// The geometry below IS the logo (locked 30 Sep 2026, see docs/BRAND.md).
// Do not redraw it anywhere else: the SVGs in public/brand, the PNG exports,
// the favicon and src/components/logo-paths.ts are all generated from here.
//
// Lettering is Montserrat Bold (the name) and Roboto Condensed Bold (the three-line
// strapline lockup), already converted to outlines in scripts/brand-glyphs.json, so no font is
// needed to build or to open the files.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "brand");
const glyphs = JSON.parse(
  readFileSync(join(root, "scripts", "brand-glyphs.json"), "utf8"),
);

// ---- Colours ---------------------------------------------------------
const ANCHOR = "#3D4F61"; // Pantone 7545 C
const SIGNAL = "#E8693A"; // Pantone 7578 C
const PRECISION = "#3AADDA"; // Pantone 298 C
const PRECISION_DEEP = "#1E8FC4"; // Precision step that is legible as small text
const WHITE = "#FFFFFF";

// ---- The mark (200 x 204 drawing grid, 14 unit stroke, round ends) ----
const STROKE = 14;
const HOUSE = [
  "M8 92 L100 22 L134 47.9 V28 H162 V69.2 L192 92", // roofline + chimney
  "M30 76 V182 H56", // left wall + doorstep
  "M170 76 V158", // right wall, stopping short so the swoosh can leave
];
// One continuous stroke: open heart, down the left side, out along the floor.
const HEART =
  "M113.5 146.5 L140.59 119.39 A27 27 0 1 0 100 84 A27 27 0 1 0 59.41 119.39 L88 148 C106 166 124 182 158 182";
const MARK_TAIL = 200; // where the swoosh ends when the mark stands alone
const TOP = 14; // artwork runs y 14..190
const BOTTOM = 190;

// ---- The name logo ---------------------------------------------------
// "Match" over "listed.com" in Montserrat Bold beside the house. The h of Match
// runs straight down into the d of listed, the dot of ".com" is the small open
// heart, and the swoosh from the big heart underlines the lot. In this lockup the
// right-hand roof is trimmed slightly so it clears the top of the l beneath it.
const NAME = glyphs.lockup;
const NAME_TOP = 8; // the M stands a little taller than the roof
const NAME_VIEWBOX = `0 ${NAME_TOP} ${NAME.w} ${192 - NAME_TOP}`;

const themes = {
  colour: { ink: ANCHOR, heart: SIGNAL, accent: PRECISION_DEEP },
  reversed: { ink: WHITE, heart: SIGNAL, accent: PRECISION },
  mono: { ink: ANCHOR, heart: ANCHOR, accent: ANCHOR },
  white: { ink: WHITE, heart: WHITE, accent: WHITE },
};

const line = (d, colour) =>
  `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`;

const mark = (t, tail) =>
  HOUSE.map((d) => line(d, t.ink)).join("") + line(`${HEART} H${tail}`, t.heart);

const svg = (viewBox, body, title = "Matchlisted.com") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

// The name logo: the primary lockup.
const logo = (t) =>
  svg(
    NAME_VIEWBOX,
    NAME.house.map((d) => line(d, t.ink)).join("") +
      line(NAME.swoosh, t.heart) +
      `<path d="${NAME.match.join("")}${NAME.listed.join("")}" fill="${t.ink}"/>` +
      `<rect x="${NAME.pillar.x}" y="${NAME.pillar.y}" width="${NAME.pillar.w}" height="${NAME.pillar.h}" fill="${t.ink}"/>` +
      `<path transform="translate(${NAME.dot.tx} ${NAME.dot.ty}) scale(${NAME.dot.k})" d="${NAME.dot.d}" fill="none" stroke="${t.heart}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${NAME.com.join("")}" fill="${t.heart}"/>`,
  );

// The mark alone.
const MARK_W = MARK_TAIL + STROKE / 2 + 1;
const markOnly = (t) =>
  svg(`0 ${TOP} ${MARK_W} ${BOTTOM - TOP}`, mark(t, MARK_TAIL), "Matchlisted");

// Strapline block: the mark beside "Where Quiet Seekers meet Hush Homes" set
// on three lines of Roboto Condensed Bold capitals. The O of HOMES is a small
// copy of the heart from the house without its swoosh: open at the bottom, both
// ends rounded, exactly as tall as the capitals (stroke edge 64.3 to 169).
const BLOCK_X = MARK_W + 30;
const CAP = glyphs.block.cap;
const PITCH = 97; // baseline to baseline, in lettering units
const blockScale = ((BOTTOM - TOP) * 0.74) / (CAP + 2 * PITCH);
const BLOCK_Y = TOP + ((BOTTOM - TOP) * 0.26) / 2;
const SMALL_HEART =
  "M117 143 L140.59 119.39 A27 27 0 1 0 100 84 A27 27 0 1 0 59.41 119.39 L100 160";
const BLOCK_W =
  Math.ceil(BLOCK_X + Math.max(...glyphs.block.lines.map((l) => l.x2)) * blockScale) + 1;
const block = (t) =>
  `<g transform="translate(${BLOCK_X} ${BLOCK_Y.toFixed(2)}) scale(${blockScale.toFixed(5)})">` +
  glyphs.block.lines
    .map((l, i) => {
      const h = l.heart;
      const heart = h
        ? `<path transform="translate(${(h.x - 42.5 * h.k).toFixed(2)} ${(-169 * h.k).toFixed(2)}) scale(${h.k})" d="${SMALL_HEART}" fill="none" stroke="${t.heart}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`
        : "";
      return `<g transform="translate(0 ${(CAP + i * PITCH).toFixed(2)})"><path d="${l.ink}" fill="${t.ink}"/>${l.blue ? `<path d="${l.blue}" fill="${t.accent}"/>` : ""}${heart}</g>`;
    })
    .join("") +
  "</g>";
const straplineBlock = (t) =>
  svg(
    `0 ${TOP} ${BLOCK_W} ${BOTTOM - TOP}`,
    mark(t, MARK_TAIL) + block(t),
    "Matchlisted. Where Quiet Seekers meet Hush Homes",
  );

// App icon / favicon: the mark on a white rounded square.
const appIcon = svg(
  "0 0 256 256",
  `<rect width="256" height="256" rx="52" fill="${WHITE}"/><g transform="translate(24 26)">${mark(themes.colour, MARK_TAIL)}</g>`,
  "Matchlisted",
);

// Social share card (1200 x 630): the strapline logo centred on Ground.
const CARD_SCALE = 980 / BLOCK_W;
const socialCard = svg(
  "0 0 1200 630",
  `<rect width="1200" height="630" fill="#F8F8F6"/><g transform="translate(110 ${((630 - (BOTTOM - TOP) * CARD_SCALE) / 2 - TOP * CARD_SCALE).toFixed(1)}) scale(${CARD_SCALE.toFixed(4)})">${mark(themes.colour, MARK_TAIL)}${block(themes.colour)}</g>`,
  "Matchlisted. Where Quiet Seekers meet Hush Homes",
);

// ---- Write everything ------------------------------------------------
mkdirSync(join(out, "png"), { recursive: true });
const files = {};
for (const [name, t] of Object.entries(themes)) {
  files[`matchlisted-logo-${name}.svg`] = logo(t);
  files[`matchlisted-mark-${name}.svg`] = markOnly(t);
}
for (const name of ["colour", "reversed"]) {
  files[`matchlisted-strapline-block-${name}.svg`] = straplineBlock(themes[name]);
}
files["matchlisted-app-icon.svg"] = appIcon;
for (const [name, body] of Object.entries(files)) writeFileSync(join(out, name), body);

const png = (name, width, to, flatten) => {
  let img = sharp(Buffer.from(files[name]), { density: 600 }).resize({ width });
  if (flatten) img = img.flatten({ background: flatten });
  return img.png().toFile(to);
};
await Promise.all([
  png("matchlisted-logo-colour.svg", 2400, join(out, "png", "matchlisted-logo-colour.png")),
  png("matchlisted-logo-reversed.svg", 2400, join(out, "png", "matchlisted-logo-reversed.png")),
  png("matchlisted-strapline-block-colour.svg", 2400, join(out, "png", "matchlisted-strapline-block-colour.png")),
  png("matchlisted-strapline-block-reversed.svg", 2400, join(out, "png", "matchlisted-strapline-block-reversed.png")),
  png("matchlisted-mark-colour.svg", 1024, join(out, "png", "matchlisted-mark-colour.png")),
  png("matchlisted-mark-reversed.svg", 1024, join(out, "png", "matchlisted-mark-reversed.png")),
  png("matchlisted-app-icon.svg", 1024, join(out, "png", "matchlisted-app-icon.png")),
  // Older docs and tools point at these two names: keep them as white-ground copies.
  png("matchlisted-logo-colour.svg", 2400, join(out, "logo-horizontal.png"), WHITE),
  png("matchlisted-mark-colour.svg", 1024, join(out, "icon.png"), WHITE),
  png("matchlisted-app-icon.svg", 512, join(root, "src", "app", "icon.png")),
  png("matchlisted-app-icon.svg", 180, join(root, "src", "app", "apple-icon.png"), WHITE),
  sharp(Buffer.from(socialCard), { density: 144 }).resize({ width: 1200 }).png().toFile(join(out, "png", "matchlisted-social-card.png")),
]);

// The site draws the logo as live SVG from the same numbers.
writeFileSync(
  join(root, "src", "components", "logo-paths.ts"),
  `// GENERATED by scripts/build-brand.mjs. Do not edit by hand.
export const LOGO = ${JSON.stringify(
    {
      stroke: STROKE,
      house: HOUSE,
      heart: HEART,
      markTail: MARK_TAIL,
      markViewBox: `0 ${TOP} ${MARK_W} ${BOTTOM - TOP}`,
      smallHeart: SMALL_HEART,
      name: { viewBox: NAME_VIEWBOX, ...NAME },
    },
    null,
    2,
  )} as const;
`,
);

console.log(`Brand files written: ${Object.keys(files).length} SVG, 10 PNG, logo-paths.ts`);
