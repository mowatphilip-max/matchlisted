# Audit remediation — plan index

> ## ▶ RESUME HERE (paused 22 Sep 2026, late evening)
>
> All eight packages are implemented on `polish/audit-remediation`. 69 files
> changed, **nothing committed, nothing staged**, `main` untouched.
>
> `tsc --noEmit` exits 0 · lint at the 2-error/8-warning baseline · `npm run build`
> compiles and typechecks, then fails only on the pre-existing `/account/password`
> prerender.
>
> **The one blocker:** `.env.local` exists and has `NEXT_PUBLIC_SUPABASE_URL` and
> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` filled in, but **`SUPABASE_SECRET_KEY` is
> still empty**. `src/lib/supabase.ts:43` requires it for the server-side client,
> and every page renders through the data layer, so the site 500s without it.
> Add it (Supabase → Settings → API → Secret key) and `npm run dev` comes up.
>
> **Then, the thing that has never been done:** none of this work has been
> feel-checked. Not once — the app has never rendered during the whole change.
> Every timing value is reasoned from the audit catalog, not observed. Each plan
> carries a "Feel check (deferred)" section; run those first, starting with:
> reduced-motion on `/` (the logo must not blink out), the heart pop on a card
> grid, the card hover at 200ms, the bottom sheet on `/seekers` at phone width,
> and the celebration panel on `/dashboard`.
>
> Three decisions still open, all yours: the failure copy in
> `src/lib/page-messages.ts` (written by Claude, in the product's voice), the logo
> heartbeat reduced 900ms→450ms rather than deleted, and whether to commit.

Produced by the `improve-animations` audit workflow, extended with `mobile-native`,
`emil-design-eng` and `apple-design`. Six parallel read-only audits, all findings
re-verified at their `file:line` before inclusion. Four findings were rejected as
misreads and are recorded in [999-rejected.md](999-rejected.md) so nobody re-raises them.

- **Commit stamped**: `b594d99`
- **Branch**: `polish/audit-remediation`
- **Deviation from template**: the skill asks for one plan per finding (19 files).
  Findings that share the same files and the same fix pattern are merged — the field
  focus rings, the iOS 14px zoom and the input height drift are one `Field` primitive,
  not three plans. Exact values are still spelled out per finding.

## Verification gate (important)

There is no `.env.local` in this checkout, which constrains what can be verified:

| Command | Status without env | Usable as a gate? |
| --- | --- | --- |
| `npm test` | Fails instantly — `vitest.config.ts:7` reads `.env.local` at config load | No |
| `npm run build` | Compiles + typechecks clean, then fails prerendering `/account/password` on the missing Supabase client | Partially |
| `npx tsc --noEmit` | Exits 0 | **Yes — primary gate** |
| `npm run lint` | 2 errors, 8 warnings | **Yes — must not exceed baseline** |

**Baseline at `b594d99`** (pre-existing, not introduced by this work):

- `react/no-unescaped-entities` — 1 error
- `react-hooks/set-state-in-effect` — 1 error (`area-finder.tsx:44`)
- 8 `no-unused-vars` warnings, including `Suspense` imported and never used in
  `src/app/seekers/page.tsx:2`

Every plan's mechanical check is: `npx tsc --noEmit` exits 0, and `npm run lint`
reports **no more than** 2 errors / 8 warnings.

Feel checks cannot be run in this environment — the app will not boot without env.
Each plan therefore carries an explicit **Feel check (deferred)** section to be run
once `.env.local` is present.

## Execution order

Waves are ordered so that no two plans in the same wave touch the same file.

| Plan | Title | Severity | Status |
| --- | --- | --- | --- |
| [001](001-motion-tokens.md) | Motion tokens + the reduced-motion delay hole | HIGH | **DONE** |
| [002](002-button-primitive.md) | Button: transition, duration, easing, size axis | HIGH | **DONE** |
| 003 | Heart pop, press feedback, card hover coherence | HIGH | **DONE** |
| 004 | error/loading/not-found boundaries + pending states | HIGH | **DONE** |
| 006 | Primitives authored (Field, Badge, Alert, EmptyState, Skeleton, ConfirmSubmit) | HIGH | **DONE** |
| 007 | Contrast, focus rings, touch targets, confirmations | HIGH | **DONE** |
| 008 | Celebrations, stagger, sheet origin, popover origin, admin parity | MEDIUM | **DONE** |
| 005 | Wire the dead redirect signals | HIGH | **DONE** |

003–008 were implemented directly rather than written up as separate plan files
first; 001 and 002 were written before implementation and are kept as the worked
examples of the format. The record of what actually changed is the branch diff.

## Signals — now fully covered

All 24 signalling redirects in `src/lib/actions.ts` render something. Copy lives in
`src/lib/page-messages.ts`; six pages were threaded with `searchParams` and render
an `Alert` (`dashboard/home/[id]`, `dashboard`, `dashboard/home/new`, `matches`,
`admin/introductions`, `homes/[id]/offer`). Five were already handled inline and
were left alone: `login` (`bad-credentials`), both contract pages (`incomplete`),
`homes/[id]` (`offer=submitted`) and `admin/settings` (`saved=1`).

**The copy is mine, not yours.** It is written to be plain and non-blaming, but it
is the product's voice on two dozen failure states and deserves a read-through.

One related weakness this exposed but did not fix: `?error=invalid` on the new-home
form means a seller who misses a required field is redirected back to a **blank**
form. The message now explains what was missing, but the typed values are still
lost, because the action redirects rather than returning state. Fixing that
properly means `useActionState` and returning field values — a bigger change.

## Still outstanding — deferred deliberately

- **`Field` adoption across 44 form sites.** The two real defects in those class
  strings — `outline-none` defeating the focus ring, and `text-sm` triggering the
  iOS zoom — were fixed in place instead. A JSX restructure of every form is the
  one change here that cannot be verified without running the app.
- **Seeker card unification.** `MowattSeekerCard` and `SeekerCard` render in the
  same grid at `seekers/[ref]/page.tsx:350` with different radii, heights and type
  scales, and the former carries 12 arbitrary font sizes and renders the anonymous
  ref at 38px against a 15.5px headline. Fixing it is a design decision about which
  card wins, not a mechanical merge.
- **Heading scale.** `.display-xl` / `.display-lg` are used on 2 of 32 h1s; the rest
  are `text-3xl`, `text-4xl sm:text-5xl` or `text-3xl sm:text-4xl`. Unifying it
  changes the look of every page and wants an eye on it.
- **Filter-result transitions** (`/seekers`, `/hush-homes` rebuild their grid in one
  frame, the latter per keystroke). `next.config.ts` already sets
  `experimental.viewTransition: true`, so the mechanism is available — but shipping
  an experimental API untested is not a good trade.
- **Two icon-only destructive controls** (`removeHomePhoto`, `deleteViewingSlot` in
  `dashboard/home/[id]/page.tsx`) still have no confirmation and are 16–32px.
  `ConfirmSubmit` assumes a text label; these need an icon affordance.
- **`admin/deals/page.tsx:80`** — an empty state rendered as a bare `<li>` inside a
  `<ul>`. `EmptyState` is `<div>`-rooted, so dropping it in would be invalid nesting.

## Out of scope, deliberately

- **`/dashboard` mutates state during render.** `collectFreshHotMatches`
  (`src/lib/matches.ts:72`) writes `recordSeenMatch` rows and fires
  `pushNotification` from inside the page body (`src/app/dashboard/page.tsx:67`).
  A Next.js prefetch can consume the celebration before the user sees it. This is a
  correctness bug in the matching flow; fixing it means moving the write behind an
  explicit acknowledgement, which is a product decision.
- **Leaflet is a dead dependency.** `leaflet` and `@types/leaflet` have zero imports;
  the area picker is a text search over `lib/areas.ts`. Left in place because
  CLAUDE.md still lists Leaflet maps in the intended stack. The stale comment in
  `next.config.ts` now says so explicitly rather than claiming the tiles are in use.

## Out of scope, deliberately

Recorded so they are not silently dropped:

- **`/dashboard` mutates state during render.** `collectFreshHotMatches` (`src/lib/matches.ts:72`)
  writes `recordSeenMatch` rows and fires `pushNotification` from inside the page body
  (`src/app/dashboard/page.tsx:65`). A Next.js prefetch can consume the celebration before
  the user ever sees it. This is a correctness bug in the matching flow, not a polish item,
  and fixing it means moving the write behind an explicit acknowledgement — a product
  decision, not a refactor. Flagged for a separate change.
- **Leaflet is a dead dependency.** `leaflet` and `@types/leaflet` have zero imports;
  the area picker is a text search over `areas.ts`. The CSP at `next.config.ts:21` still
  allows `tile.openstreetmap.org` on a stale comment. Handled in 008 as housekeeping.
