# 999 — Findings rejected during vetting

Recorded so they are not re-raised. Each was reported by an audit pass and then
disproved by re-reading the cited code or by compiling a probe.

## R1 — "65 Tailwind `hover:` utilities are ungated, so hover sticks on touch"

**Rejected. Tailwind gates them automatically.**

Tailwind v4.3.3 compiles the `hover` variant to `&:hover { @media (hover: hover) { … } }`.
Verified twice: in `node_modules/tailwindcss/dist/lib.js`, the variant is registered as

```js
i.static("hover", p => { p.nodes = [H("&:hover", [B("@media", "(hover: hover)", p.nodes)])] })
```

and by compiling this repo's own classes, which emit:

```css
@media (hover: hover) {
  .group-hover\:scale-\[1\.04\]:is(:where(.group):hover *) { scale: 1.04; }
}
```

So `hover:` **and** `group-hover:` are both capability-gated already. The only
genuinely ungated hover motion in the codebase is `.nav-link::after`
(`globals.css:228-231`), hand-written in raw CSS — and `.nav-link` only renders
inside `hidden … md:flex` (`site-header.tsx:37`), so phones never see it. A touch
tablet at `md`+ can stick it. LOW, left as is.

The residual real gap is that Tailwind's gate is `(hover: hover)` without
`and (pointer: fine)`, so a stylus or an Android device reporting hover capability
still sticks. That is Tailwind's default, not this codebase's doing.

## R2 — "The dashboard match rings animate on every page load"

**Rejected. They celebrate once, ever, per match.**

The panel is gated on `fresh`, which comes from `collectFreshHotMatches`
(`src/lib/matches.ts:72`). That function calls `recordSeenMatch` for every pairing
it returns (`:80`, `:101`) and skips anything `hasSeenMatch` already covers
(`:79`, `:100`). A given pairing therefore appears exactly once for a given user.

A 900ms arc sweep on a genuinely once-ever event is precisely the delight budget
the frequency rule allows. Left at 900ms deliberately.

## R3 — "`scale(0)` entrances violate the never-from-nothing rule"

**Rejected. No `scale(0)` exists anywhere.**

Grepped `scale(0` and `scale-0` across `src/`. The only near-zero starts are in the
Concept Reel: `reel-ring` at `scale(0.5)`, `reel-heart` at `scale(0.3)`,
`reel-sparkle` at `scale(0.4)`. None is `scale(0)`, all pair with `opacity: 0`, and
the sparkles genuinely originate from a point, which is correct physics rather than
an element appearing from nothing.

## R4 — "The dual-handle budget slider tweens instead of tracking the pointer"

**Rejected. It is already correct.**

`brief-form.tsx:283-302` is two native `<input type="range">` elements; the browser
drives thumb position directly from the pointer. The orange fill is set from inline
`left`/`right` percentages recomputed on every `onChange` (`:276-282`), with no
`transition` and no keyframe on `.dual-range` or either thumb pseudo-element. The
drag tracks the finger 1:1.

(The fill animates `left`/`right` rather than `transform`, which is a performance
nit — but nothing animates them, so there is no per-frame cost.)
