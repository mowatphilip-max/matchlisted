// Builds every Matchlisted logo file from one fixed drawing.
//
//   node scripts/build-brand.mjs      (or: npm run build-brand)
//
// The geometry below IS the logo (locked 30 Sep 2026, see docs/BRAND.md).
// Do not redraw it anywhere else: the SVGs in public/brand, the PNG exports,
// the favicon and src/components/logo-paths.ts are all generated from here.
//
// Lettering is Montserrat Bold ("Matchlisted.com"), Montserrat SemiBold (one-line
// strapline) and Roboto Condensed Bold (three-line strapline lockup), already converted to outlines in scripts/brand-glyphs.json, so no font is
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

// ---- The wordmark ----------------------------------------------------
const WORD_X = 212;
const WORD_BASELINE = 156;
const WORD_END = WORD_X + glyphs.word.x2;
const LOCKUP_TAIL = Math.round(WORD_END + 6); // underline runs just past ".com"
const LOCKUP_W = LOCKUP_TAIL + STROKE / 2 + 1;

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

const word = (t) =>
  `<g transform="translate(${WORD_X} ${WORD_BASELINE})"><path d="${glyphs.word.d.name}" fill="${t.ink}"/><path d="${glyphs.word.d.com}" fill="${t.heart}"/></g>`;

const svg = (viewBox, body, title = "Matchlisted.com") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

// Horizontal logo: the primary lockup.
const logo = (t) =>
  svg(`0 ${TOP} ${LOCKUP_W} ${BOTTOM - TOP}`, mark(t, LOCKUP_TAIL) + word(t));

// Horizontal logo with the strapline set beneath the underline.
const STRAP_BASELINE = 218;
const strapScale = (WORD_END - (WORD_X + glyphs.word.x1)) / (glyphs.strap.x2 - glyphs.strap.x1);
const strap = (t) =>
  `<g transform="translate(${(WORD_X + glyphs.word.x1 - glyphs.strap.x1 * strapScale).toFixed(2)} ${STRAP_BASELINE}) scale(${strapScale.toFixed(5)})"><path d="${glyphs.strap.d.a}" fill="${t.ink}"/><path d="${glyphs.strap.d.b}" fill="${t.accent}"/></g>`;
const logoStrapline = (t) =>
  svg(
    `0 ${TOP} ${LOCKUP_W} ${STRAP_BASELINE + 6 - TOP}`,
    mark(t, LOCKUP_TAIL) + word(t) + strap(t),
    "Matchlisted.com. Where Quiet Seekers meet Hush Homes",
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

// Stacked: mark above the name, for square spaces.
const STACK_W = 560;
const stacked = (t) => {
  const s = 1.5;
  const mx = (STACK_W - MARK_W * s) / 2;
  const wx = (STACK_W - (glyphs.word.x2 - glyphs.word.x1)) / 2 - glyphs.word.x1;
  return svg(
    `0 0 ${STACK_W} 352`,
    `<g transform="translate(${mx} ${-TOP * s}) scale(${s})">${mark(t, MARK_TAIL)}</g>` +
      `<g transform="translate(${wx.toFixed(2)} 344)"><path d="${glyphs.word.d.name}" fill="${t.ink}"/><path d="${glyphs.word.d.com}" fill="${t.heart}"/></g>`,
  );
};

// App icon / favicon: the mark on a white rounded square.
const appIcon = svg(
  "0 0 256 256",
  `<rect width="256" height="256" rx="52" fill="${WHITE}"/><g transform="translate(24 26)">${mark(themes.colour, MARK_TAIL)}</g>`,
  "Matchlisted",
);

// ---- Write everything ------------------------------------------------
mkdirSync(join(out, "png"), { recursive: true });
const files = {};
for (const [name, t] of Object.entries(themes)) {
  files[`matchlisted-logo-${name}.svg`] = logo(t);
  files[`matchlisted-mark-${name}.svg`] = markOnly(t);
}
for (const name of ["colour", "reversed"]) {
  files[`matchlisted-logo-strapline-${name}.svg`] = logoStrapline(themes[name]);
  files[`matchlisted-stacked-${name}.svg`] = stacked(themes[name]);
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
  png("matchlisted-logo-strapline-colour.svg", 2400, join(out, "png", "matchlisted-logo-strapline-colour.png")),
  png("matchlisted-strapline-block-colour.svg", 2400, join(out, "png", "matchlisted-strapline-block-colour.png")),
  png("matchlisted-strapline-block-reversed.svg", 2400, join(out, "png", "matchlisted-strapline-block-reversed.png")),
  png("matchlisted-stacked-colour.svg", 1600, join(out, "png", "matchlisted-stacked-colour.png")),
  png("matchlisted-mark-colour.svg", 1024, join(out, "png", "matchlisted-mark-colour.png")),
  png("matchlisted-mark-reversed.svg", 1024, join(out, "png", "matchlisted-mark-reversed.png")),
  png("matchlisted-app-icon.svg", 1024, join(out, "png", "matchlisted-app-icon.png")),
  // Older docs and tools point at these two names: keep them as white-ground copies.
  png("matchlisted-logo-colour.svg", 2400, join(out, "logo-horizontal.png"), WHITE),
  png("matchlisted-mark-colour.svg", 1024, join(out, "icon.png"), WHITE),
  png("matchlisted-app-icon.svg", 512, join(root, "src", "app", "icon.png")),
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
      lockupTail: LOCKUP_TAIL,
      markViewBox: `0 ${TOP} ${MARK_W} ${BOTTOM - TOP}`,
      lockupViewBox: `0 ${TOP} ${LOCKUP_W} ${BOTTOM - TOP}`,
      wordTransform: `translate(${WORD_X} ${WORD_BASELINE})`,
      wordName: glyphs.word.d.name,
      wordCom: glyphs.word.d.com,
    },
    null,
    2,
  )} as const;
`,
);

console.log(`Brand files written: ${Object.keys(files).length} SVG, 12 PNG, logo-paths.ts`);
