# Matchlisted.com — the marketplace product

> ## ⚠ READ `docs/DECISIONS.md` BEFORE ANY BUILD WORK
>
> It is the authoritative record of product, pricing and legal decisions.
> **Where it conflicts with `docs/BUILD-BRIEF.md`, with `GO-LIVE.md`, or with this file,
> DECISIONS.md wins.**
>
> As at 10 August 2026 it overturns two of the build brief's own §12 "non-negotiables"
> and amends a third. Building from the brief alone will produce the wrong behaviour on
> **free claims**, the **solicitor panel**, and the **For Sale board**.

## What this is
A property marketplace: sellers list homes, buyers register briefs, the system matches
them, and Matchlisted takes the transaction end to end — offers, Home Reports, invoices,
card payments, solicitor introductions — through an admin back office.

Run: `npm run dev` -> **http://localhost:3000**
Database: Supabase project `gqyvxtccpqitktdefhnh`
Branch: `main` · remote: `github.com/mowatphilip-max/matchlisted` (private)

## What this is NOT
**This is not the Mowatt website.** `../mowatt-uk` is a separate product with its own
repo, its own Supabase project and its own port. They share concepts and several file
names. Before editing, confirm you are under `matchlisted/`.

Rule of thumb: if it is about **Mowatt the agency** — its brand, its own clients, its own
listings — it belongs in `mowatt-uk`. If it is **product any seller or agent could use**,
it belongs here.

## Stack
Next.js (App Router) · TypeScript · Tailwind · Supabase (`@supabase/ssr`) · Leaflet maps ·
Stripe Checkout · Vercel

## Map of the code
- `src/app/` — public: `/`, `/hush-homes`, `/quiet-seekers`, `/homes/[id]`, `/seekers`,
  `/join`, `/login`. Seller: `/dashboard`, `/dashboard/home/[id]`, `/dashboard/brief`,
  `/matches`, `/viewings/[id]/feedback`. Money: `/pay/[invoiceId]`, `/pay/success`,
  `/api/webhooks/stripe`. Admin: `/admin` + deals, orders, reports, invoices, lawyers,
  introductions, emails, users, settings.
- `src/lib/` — `db.ts` + `db-mappers.ts` (data layer), `match.ts` + `matches.ts` (the
  matching logic — the core IP), `fulfilment.ts` (Home Report ordering), `stripe.ts`,
  `storage.ts`, `session.ts`, `alerts.ts`, `pulse.ts`,
  `mowatt-bridge.ts` + `mowatt-seekers.ts` (reads seeker data from the Mowatt side).
- `supabase/migrations/` — 0001..0006, in order.
- `GO-LIVE.md` — **read this first.** A go-live audit from 27 July 2026 listing every
  blocker in priority order.

## Where it stands
Earlier stage than Mowatt.uk. The 27 July audit called it a convincing prototype, not yet
a product, and estimated 8–13 weeks to a responsible launch. Since then Supabase and
Stripe Checkout have landed (latest commit: "Card payments via Stripe Checkout, fulfilled
only by signed webhook"). **Re-check `GO-LIVE.md` against reality before trusting it** —
parts of it are now out of date. The admin-area authentication item is worth confirming
first.

## Conventions
- Read `AGENTS.md` — this Next.js version has breaking changes from training data.
  Check `node_modules/next/dist/docs/` before writing framework code.
- **Prices are quoted inclusive of VAT on every consumer-facing surface.** Never render
  "+ VAT" anywhere a seller or buyer can see it. See `docs/DECISIONS.md` §2.
- **Never charge a solicitor a fee per introduction** — Law Society of Scotland rule D9.2.
  The conveyancing revenue is a case-pack service fee plus a fixed panel seat. See §6.
- Never commit `.env.local`. `.gitignore` covers `.env*`. Stripe keys are test keys only
  until launch day.
- Fulfilment must stay webhook-driven: an order is only fulfilled by a **signed** Stripe
  webhook, never by the browser returning to `/pay/success`. Do not weaken this.
- Migrations are append-only and numbered — never edit an applied one.
- `NEXT_PUBLIC_SITE_URL` is `http://localhost:3000`; if the dev port ever changes, change
  it too or Stripe redirects will break.

## Shared ground with Mowatt.uk
Both have `areas.ts`, `session.ts`, `site.ts`, `format.ts`, `types.ts`, `sample-data.ts`
and the Hush Homes / Quiet Seekers concepts. **These are deliberate copies, not shared
code.** Changing one does not change the other. Porting a fix across is a decision, not
an automatic follow-up. `mowatt-bridge.ts` is the one real coupling.

## Open risk
**The registrations are the critical path, not the code.** Matchlisted Ltd is a new company
and inherits none of Mowatt's permissions — redress, HMRC AML supervision, ICO and VAT must
all be obtained fresh, and estate agency work without AML supervision is an offence. If the
applications are not filed by the end of September 2026, the January 2027 launch is at risk
regardless of build progress.

**`docs/BUILD-BRIEF.md` still contradicts `docs/DECISIONS.md`** in several places. The
decision log wins by instruction, but the brief needs rewriting so the two agree.
