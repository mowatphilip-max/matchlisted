# 002 — Button: transition, duration, easing, and a size axis

- **Status**: TODO
- **Commit**: `b594d99`
- **Severity**: HIGH
- **Category**: 2 (Easing & duration) + 5 (Performance) + touch targets
- **Estimated scope**: 1 file (`src/components/ui/button.tsx`), rewritten; call sites migrate in 007
- **Depends on**: 001 (consumes `--duration-press`, `--ease-out`)

## Problem

`src/components/ui/button.tsx:12` is one string with four separate faults, and it is
the single shared button — 31 files import it, 72 `<Button>` / `<ButtonLink>` usages:

```
/* src/components/ui/button.tsx:12 — current */
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-wide transition-all duration-200 min-h-11 px-6 py-3 cursor-pointer select-none active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none motion-reduce:active:scale-100"
```

1. **`transition-all`** — AUDIT §5: "always a finding". The only properties that ever
   change across all six variants are `background-color`, `box-shadow`, ring/outline,
   `opacity` and the `active:` transform. `all` buys nothing and sweeps in
   layout-adjacent properties on every button in the app.
2. **`duration-200`** — this governs the `active:scale-[0.97]` press feedback. AUDIT §2's
   band for button press feedback is **100–160ms**. 200ms reads soft rather than responsive.
3. **No easing specified** — inherits Tailwind's `cubic-bezier(0.4, 0, 0.2, 1)`, an
   ease-*in*-out. The press-down therefore starts slow at exactly the moment the user is
   watching hardest. AUDIT §2: "`ease-in` on UI is always a finding."
4. **No size axis.** `Variant` (`:9`) has no size dimension, so 20 call sites hand-roll one
   by overriding `min-h-11`. Measured distribution across `src/**/*.tsx`:
   `min-h-7` ×1, `min-h-8` ×1, `min-h-9` ×16, `min-h-10` ×6, `min-h-12` ×5.
   Seventeen land below the 44px target that `min-h-11` was chosen to guarantee —
   including `src/app/admin/invoices/page.tsx:85` ("Mark paid", a financial state change
   at 28px) and `src/app/dashboard/home/[id]/page.tsx:241`.

## Target

```tsx
/* target */
type Variant = "primary" | "seller" | "seeker" | "secondary" | "ghost" | "onDark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-wide " +
  "transition-[background-color,box-shadow,transform,opacity,outline-color] " +
  "duration-[var(--duration-press)] ease-out " +
  "cursor-pointer select-none active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none motion-reduce:active:scale-100";

// Compact sizes stay visually small on a mouse but still present a 44px target
// to a finger — `pointer-coarse` is the escape hatch that lets dense admin rows
// exist without failing touch-target sizing.
const sizes: Record<Size, string> = {
  sm: "min-h-8 pointer-coarse:min-h-11 px-4 py-1.5 text-xs",
  md: "min-h-11 px-6 py-3 text-sm",
  lg: "min-h-12 px-7 py-3.5 text-base",
};
```

`ease-out` resolves to `var(--ease-out)` = `cubic-bezier(0.23, 1, 0.32, 1)` because 001
redefined the `--ease-out` theme key. Verified by compiling: the utility emits
`transition-timing-function: var(--ease-out)`.

Both `ButtonLink` and `Button` gain `size?: Size` defaulting to `"md"`, and compose
`cn(base, sizes[size], variants[variant], className)` so a call site's `className`
still wins last via `tailwind-merge`.

## Repo conventions to follow

- The file documents its variant system in a comment block at `:4-8`. Extend that
  comment to cover sizes in the same voice — say what each size is *for*, not what it is.
- `cn` is `src/lib/utils.ts`; it is `tailwind-merge`-backed, so later classes win.
- Exemplar of the existing prop pattern to imitate: `ButtonLink` at `:34-46`.

## Steps

1. Add the `Size` type and `sizes` record shown above.
2. Rewrite `base`: remove `transition-all`, `duration-200`, `min-h-11`, `px-6`, `py-3`
   and `text-sm` (the last four move into `sizes.md`); add the explicit transition
   property list, `duration-[var(--duration-press)]` and `ease-out`.
3. Add `size?: Size` to `ButtonLinkProps` and `ButtonProps`, default `"md"`, and thread
   it into both `cn(...)` calls in the order `base, sizes[size], variants[variant], className`.
4. Extend the header comment to document the size axis.
5. Do NOT migrate call sites in this plan — that is 007. Existing `min-h-*` overrides in
   `className` keep working unchanged because they merge last.

## Boundaries

- Do NOT change any `variants` entry — the colour system is deliberate and documented
  at `:4-8`; `ghost`'s `px-4` override is intentional and must survive.
- Do NOT touch call sites. This plan must be a drop-in: every existing usage renders
  identically except for the press timing.
- Do NOT add dependencies.

## Verification

- **Mechanical**: `npx tsc --noEmit` exits 0 — this is the real check, since adding a
  required prop by mistake would break 72 call sites. `npm run lint` at or below
  2 errors / 8 warnings. Compile-check that `transition-[...]` emits a real
  `transition-property` list and not an arbitrary-value fallback.
- **Feel check (deferred — needs `.env.local`)**:
  - Press and hold a primary button. It should snap down, not sink. Compare against
    `git stash` of this change — the difference at 200ms→140ms is felt, not seen.
  - In the Animations panel at 10%, confirm only background/shadow/transform move.
  - Enable `prefers-reduced-motion` and confirm the button still changes colour on
    hover but no longer scales on press.
- **Done when**: `transition-all` appears nowhere in `src/components/ui/`, and
  `<Button size="sm">` renders at 32px under a mouse and 44px under `pointer: coarse`.
