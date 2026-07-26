# Matchlisted.com — prototype

**Where Quiet Seekers meet Hush Homes.** The dating site for homes, across all
of Scotland: free Hush Home listings gated behind verified Home Reports,
free Quiet Seeker registration gated behind a signed 0.8% sourcing-fee
agreement, and a Match % scored between every home and every brief.

Built on the Mowatt prototype's stack: Next.js 16 (App Router, Turbopack),
React 19, Tailwind CSS 4, TypeScript. Runs with **zero backend setup** — all
data lives in an in-memory store seeded from `src/lib/sample-data.ts`
(state resets on server restart).

## Run it

```bash
npm install
npm run dev   # http://localhost:3000
```

### Demo sign-ins (`/login`)

| Persona | Shows |
| --- | --- |
| **Ailsa** — Quiet Seeker | East Lothian brief with a 99% match waiting ("It's a match") |
| **Gordon** — seller | Live Gullane listing, anonymised seeker matches |
| **Rachel** — both roles | Selling in Shawlands + seeking in East Lothian |
| **Struan** — new seller | Draft listing: walk the contract → Home Report → verify gate |
| **Kirsty** — buying now | Completed viewing, accepted offer, appointed lawyer |
| **Phil** — admin | Full back-office: reports, deals, invoices, users, lawyers, weights |

## Where things live

- `src/lib/match.ts` — **the matching engine.** Weights: Location 35 ·
  Price 25 · Beds 12 · Type 10 · Baths 8 · Garden 6 · Extras 4, with hard
  gates (wrong region caps at 15%, >10% over budget caps at 25%, missing
  must-have garden caps at 49%). Tunable live at `/admin/settings`.
- `src/lib/areas.ts` — Scotland model: regions → councils → places.
- `src/lib/db.ts` — in-memory store (the seam for Supabase).
- `src/lib/actions.ts` — every mutation (server actions).
- `src/lib/site.ts` — all fees & contract versions, single source of truth.
- `src/app/pay/[invoiceId]` — demo checkout (the seam for Stripe Checkout).
- `public/brand/` — logo slots; current files are placeholders, overwrite
  with the supplied artwork (same filenames, no code changes needed).
- `supabase/migrations/` — production schema mirroring the TypeScript types.

## The funnel

Seeker: register → build brief → sign agreement (checkbox + typed name +
IP/timestamp audit trail) → matches → save (orange heart) → book a viewing
from the seller's diary → post-viewing feedback ("Still interested?") →
appoint a lawyer (£100 + VAT deposit) → offer → seller accepts/declines/
counters → admin concludes missives → 0.8% + VAT sourcing-fee invoice raised
automatically.

Seller: register → build profile (free) → sign seller agreement (exclusive
quiet sale; £300 + VAT withdrawal fee) → order Home Report through the site
(Allied Surveyors / Graham + Sibbald; our £100 margin) → upload completed
report → admin verifies → **live**.

### The public Quiet Seekers directory + Introductions

Quiet Seekers are listed publicly exactly like Hush Homes (`/seekers`):
anonymised cards with a story, budget range, buying position and areas —
never a name. Anyone can click any seeker; clicking "They might want my
home" prompts registration as a Hush Home (`/join?as=seller&seeker=QS-…`)
and records an **Introduction** (`new → offered → accepted/declined`).
Admin (`/admin/introductions`) offers the introduction to the seeker only
once the gate is met — seller registered, home profile complete, agreement
signed (Home Report status shown alongside). The seeker accepts or declines
from their dashboard; accepting unlocks the (possibly not-yet-live) home at
`/homes/[id]`. Nobody's identity crosses the line until the seeker says yes.

Dev helper: `GET /api/dev/reset` reseeds the in-memory store from
sample-data without a server restart.

## Production TODOs

- Swap `src/lib/db.ts` internals for Supabase (schema ready in
  `supabase/migrations/`), Supabase Auth for `src/lib/session.ts`.
- Stripe Checkout at the `/pay` seam; photo & Home Report upload to private
  Supabase Storage (`/homes/[id]/report` route already gates downloads).
- Real Home Report supplier pricing/ordering integration.
- Email notifications alongside the in-app ones.
