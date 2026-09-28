# 001 — Motion tokens, and the reduced-motion delay hole

- **Status**: TODO
- **Commit**: `b594d99`
- **Severity**: HIGH
- **Category**: 7 (Cohesion & tokens) + 6 (Accessibility)
- **Estimated scope**: 1 file (`src/app/globals.css`), ~40 lines changed

## Problem

### 1a — Ten easings, fourteen durations, zero tokens

`@theme` (`src/app/globals.css:16-55`) tokenizes colour, radius and shadow, and then
stops. Every curve and duration in the product is hand-typed at its use site:

| Easing | Sites |
| --- | --- |
| `cubic-bezier(0.16, 1, 0.3, 1)` | `globals.css:159`, `:171`, `:199` |
| `cubic-bezier(.16,1,.3,1)` — same curve, second spelling | `src/app/board-uvy2tlvzvc42/board.html:68` |
| `cubic-bezier(0.2, 0.7, 0.3, 1)` | `globals.css:246`, `:247` |
| bare `ease-out` | `globals.css:219`, `:222`, `:274`, `:322`, `:342`, `:591` |
| Tailwind `ease-out` utility | `home-card.tsx:38`, `seeker-card.tsx:50`, `hush-homes/browser.tsx:175` |
| bare `ease-in-out` | `globals.css:172`, `:180` |
| `linear` | `globals.css:363` |
| Tailwind implicit `cubic-bezier(0.4, 0, 0.2, 1)` | ~30 bare `transition-*` sites |

Four different durations serve one interaction tier: `150ms` (Tailwind implicit),
`0.2s` (`globals.css:199`), `200ms` (`button.tsx:12`), `0.25s` (`globals.css:246`).

### 1b — The reduced-motion kill switch has a hole

```css
/* src/app/globals.css:62-73 — current */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

It overrides `animation-duration` and `animation-iteration-count` but **not
`animation-delay`**. Combined with `both` fill-mode, the *backwards* fill pins the
`from` frame for the entire delay. Confirmed affected:

- `.fade-up-late` (`globals.css:222`, `0.15s` delay) wraps the ConceptReel at
  `src/app/page.tsx:172` → held at `opacity: 0; translateY(18px)` for 150ms, then pops.
- `.logo-drawn .lm-house:nth-of-type(2)` / `(3)` (`globals.css:162`, `:165` —
  `0.18s` / `0.3s` delays) → held at `stroke-dashoffset: 1`, i.e. invisible.
- `.logo-drawn .lm-heart` (`globals.css:171`, `0.5s` delay) → the orange heart is
  invisible for half a second on every page that draws the logo.

A reduced-motion user gets content that vanishes and then pops in — the exact
effect the setting exists to prevent. AUDIT §6: reduced motion means fewer and
gentler animations, **not zero**.

Evidence the switch is already known to be too broad: the authors had to build a
parallel static tableau (`.reel-static`, `globals.css:565-577`) to route around it,
with the comment *"the global kill-switch would freeze the reel on its faded-out
last frame"*.

## Target

Add a motion scale to `@theme`. Tailwind v4.3.3 treats `--ease-*` as a theme
namespace, so defining these **also overrides the `ease-*` utilities** — the three
`ease-out` utilities on card images pick up the strong curve for free. Verified
against `node_modules/tailwindcss/theme.css`.

```css
/* target — inside @theme, after the shadow block */

  /* Motion — one scale. Curves per the Kowalski catalog: built-in CSS easings
     are too weak for deliberate motion. Redefining --ease-* also retargets the
     Tailwind ease-* utilities, so bare `ease-out` in JSX gets the strong curve. */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  /* Durations. UI stays under 300ms; marketing may exceed it. */
  --duration-press: 140ms;   /* button/press feedback (band: 100-160) */
  --duration-pop: 160ms;     /* tooltips, small popovers (125-200) */
  --duration-menu: 200ms;    /* dropdowns, selects (150-250) */
  --duration-sheet: 300ms;   /* modals, drawers (200-500) */
  --duration-reveal: 600ms;  /* marketing reveals — deliberately over the UI ceiling */

  /* Bare `transition-*` utilities inherit these instead of Tailwind's
     cubic-bezier(0.4, 0, 0.2, 1). Hover/colour changes want `ease`. */
  --default-transition-duration: 150ms;
  --default-transition-timing-function: ease;
```

Reduced-motion block gains the missing property and keeps opacity feedback:

```css
/* target */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    /* Not zero: movement is removed, opacity/colour feedback survives. The
       delay override is load-bearing — `both` fill would otherwise hold the
       `from` frame (invisible, for .logo-drawn) for the full delay. */
    animation-delay: 0ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Repo conventions to follow

- Tokens live in the single `@theme` block at `src/app/globals.css:16-55`, grouped
  under a `/* Comment */` header per group. Follow that grouping exactly.
- The file documents *why* a value was chosen (see the palette note at `:3-15`).
  Match that density — each motion group gets a one-line rationale.
- Exemplar of a correctly-gated reduced-motion treatment already in the file:
  `globals.css:255-259` (`.card-lift` drops the transform, keeps the shadow).

## Steps

1. In `src/app/globals.css`, append the motion block above to `@theme`, after the
   `--shadow-glow` line (`:54`) and before the closing `}` (`:55`).
2. Replace the reduced-motion block at `:62-73` with the target version.
3. Replace both hand-typed curves with the tokens:
   - `:159` `logo-trace 0.7s cubic-bezier(0.16, 1, 0.3, 1) both` → `var(--ease-out)`
   - `:171` same substitution in the `.lm-heart` shorthand
   - `:199` `.nav-link::after` → `transition: transform var(--duration-menu) var(--ease-out);`
   - `:246-247` `.card-lift` → `var(--duration-menu) var(--ease-out)` on both lines
4. Replace bare `ease-out` in keyframe shorthands with `var(--ease-out)` at
   `:219`, `:222`, `:274`, `:322`, `:342`, `:591`.
5. Leave `:363` (`.reel-run` `animation-timing-function: linear`) alone — `linear`
   is correct for a constant-motion master clock per AUDIT §2.

## Boundaries

- Do NOT touch `src/app/board-uvy2tlvzvc42/board.html`. It is a served internal
  page with its own stylesheet; consolidating it is out of scope for this plan.
- Do NOT change any `@keyframes` geometry — only timing functions and delays.
- Do NOT change `--reel: 15s` or any reel percentage window.
- Do NOT add dependencies.

## Verification

- **Mechanical**: `npx tsc --noEmit` exits 0. `npm run lint` reports no more than
  2 errors / 8 warnings. Confirm the tokens actually compile by checking that
  `ease-out` resolves to the new curve — the three card-image utilities should
  now emit `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Feel check (deferred — needs `.env.local`)**:
  - Toggle `prefers-reduced-motion: reduce` in DevTools → Rendering. Load `/`.
    The logo must be **fully visible immediately**, not blank-then-present. The
    ConceptReel area must not pop in after a beat.
  - Hover a nav link. The underline should feel snappier than before, not slower.
  - In the Animations panel at 10% speed, confirm the card lift and the nav
    underline now share a curve shape.
- **Done when**: no raw `cubic-bezier(` remains in `globals.css` outside the
  `@theme` block, and a reduced-motion load shows no invisible-then-popping element.
