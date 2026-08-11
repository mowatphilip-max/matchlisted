# Matchlisted — Status Report

Produced 6 August 2026 by re-reading the code, schema, migrations and tests against
`docs/BUILD-BRIEF.md`. Every claim below cites a file (and line where it matters) or a
command that was actually run. Re-run this report by asking Claude Code to repeat the
exercise: read the brief, verify each phase against the source, run `npm test` and
`node scripts/seed.mjs --status`, and rewrite this file.

Evidence baseline for this report:

- `npm test` run 6 Aug 2026: **13/13 legal-gate tests pass** against the real dev
  Supabase project.
- `node scripts/seed.mjs --status` run 6 Aug 2026: 19 demo accounts, 19 homes,
  11 briefs, 3 introductions, 3 invoices, 18 purchase orders, **19 charges**.
- `git log`: last commit is `110d4ea` (Stripe Checkout). Everything since — the whole
  Phase 1 close-out, both new migrations, the legal-gate test, the policy pages, the
  seed script, the build brief itself — is **uncommitted working-tree changes**
  (60 modified files, 13 untracked paths, ~2,400 insertions). There is **no git
  remote**: the entire project exists only on this one machine.

---

## 1. WHERE WE ARE

Matchlisted is a working prototype of the whole product on its *old* business model,
plus the completed legal-and-money foundations of the *new* January 2027 model. A
visitor today can browse live homes, register, sign agreements, order and pay for a
Home Report by card, receive admin verification, go live, get matched, make an offer,
and be invoiced a fixed £300 buyer fee when missives conclude — all against a real
Postgres database with real password logins and real (sandbox) Stripe payments. What
does **not** exist yet is the new model the brief describes: the public Match Report,
the deferred "pay when you sell" Home Report with a stored-card mandate, identity
checks, the s.18 fee statement and cancellation consents, solicitor mandates, and all
the growth surfaces. The legal gate — the rule that nothing pre-live is ever visible
to a buyer — is genuinely enforced in the data layer and covered by a passing
13-test suite. Emails still go to an internal outbox, not to real inboxes. And none
of the last fortnight's work is committed to git or backed up anywhere.

---

## 2. PHASE STATUS

Percentages are against what the brief specifies, not against the old prototype.
"Prototype-shaped" means a version exists from before the brief and does part of the
job, but not the brief's version.

| Phase | Status | % | Evidence |
|---|---|---|---|
| 1 — Foundations & legal gate | **Complete** (code-side) | 95% | Data-layer scope: `src/lib/db.ts:257-286` (`getHomeFor`, `PUBLIC_HOME_STATUSES`); test: `src/lib/__tests__/legal-gate.test.ts` — 13 tests, all passing 6 Aug. Charge + AuditLog models: `supabase/migrations/0007_charges_audit.sql`; `audit()` called at `src/lib/actions.ts:1005`, `src/app/homes/[id]/report/route.ts:59`, `src/lib/db.ts:782,853`. Legal footer: `src/components/site-footer.tsx:9-16`. £0–£0 budget bug fixed: `src/lib/format.ts:26-29`. Nav/IA fix: `src/components/site-header.tsx:13-15`. Config module: `src/lib/site.ts:29-82`. Missing 5%: the footer's legal facts are placeholders (blocked on §4 below) and the four policy pages (`src/app/terms`, `privacy`, `cookies`, `complaints`) are honest holding pages awaiting solicitor text — e.g. `terms/page.tsx:13-18` says "The full terms are being prepared for launch." |
| 2 — Seller funnel | **In progress** | ~15% | Schema is done: `supabase/migrations/0008_listing_lifecycle.sql` adds `shadow`/`hr_ordered`/`expired` statuses, `approval_status`, `owner_estimate`, `go_live_at`/`expires_at`, and the `match_report_leads` table. The Match Report scoring engine exists at `src/lib/match-report.ts` but **nothing imports it — there is no public Match Report page**. The listing form (`src/components/home-form.tsx`, 250 lines) is the old single-page prototype form, not the brief's multi-step builder with quality score. There is **no admin approval queue UI** — `approval_status` defaults to `pending` and nothing reads or writes it. |
| 3 — Money & identity | **In progress** | ~15% | What exists is the *old upfront* model: Stripe hosted Checkout with signature-verified webhook fulfilment (`src/lib/stripe.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/lib/fulfilment.ts`). The brief's Phase 3 is essentially not started: **no SetupIntent / off_session mandate anywhere** (grep confirms), the charges ledger has CRUD in `db.ts:770-` but **no application code writes a charge** — only `scripts/seed.mjs` does; `adminConcludeMissives` (`actions.ts:1024-1058`) still writes to the old `invoices` table. No 14-day notice system, no s.18 fee statement screen, no cancellation consents, no AML/IDV integration (no Verification table in any migration, no provider code), no admin collections view. |
| 4 — Go live & matching | **In progress, prototype-shaped** | ~50% | Home Report ordering (banded quotes, 3 surveyors, purchase orders: `src/lib/site.ts:115-204`, `src/app/admin/orders`), private-bucket storage with 2-minute signed links (`src/lib/storage.ts`), admin verification → live transition with audit, seeker alerts and queued-introduction firing (`src/lib/actions.ts:1005-1022`), match computation and batched alerts (`src/lib/match.ts`, `src/lib/alerts.ts`), audited Home Report downloads (`src/app/homes/[id]/report/route.ts`), buyer dashboard. Missing per the brief: the live transition checks neither seller AML (doesn't exist) nor listing approval, and **never sets `goLiveAt`/`expiresAt`** — the columns are mapped (`db-mappers.ts:146-147`) but nothing writes them, so the 12-month longstop cannot fire. |
| 5 — Offers & solicitors | **In progress, prototype-shaped** | ~30% | Offer flow with counters exists (`src/app/homes/[id]/offer/page.tsx`), lawyer appointment with £100 deposit before offering (`offer/page.tsx:96-139`), missives-concluded cascade raising the £300 buyer fee (`actions.ts:1024-1058`), admin deals and lawyers pages. Missing per the brief — and one live compliance gap: the flow is labelled **"Make your offer" / "Send my offer to the seller"** (`offer/page.tsx:58,191`) with no "this is not a binding offer" statement anywhere in the flow (only the terms placeholder mentions Notes of Offer). Brief §3/§6.7 requires Note-of-Offer framing. No panel presentation with visible opt-out, no commission disclosure, no mandate generation/signature, no handoff pack. |
| 6 — Add-ons & growth | **Not started** | ~2% | Only config constants exist (`site.ts:35-38` add-on fees, `:55` nudge days, `:66` town-hub threshold). No add-on store, no six-week nudge, no photography supplier workflow, no `/looking-in/[town]` pages, no seeker OG share images, no magic-link/Google/Apple signup. The absence of OG/sitemap routes is verified by the legal-gate tripwire test (`legal-gate.test.ts:252-281`). |

---

## 3. CLOSE-OUT VERIFICATION (the seven Phase-1 review items)

**a. Accepted-introduction exception removed — ✅ DONE.**
Implementation: `src/lib/db.ts:264-286` — `getHomeFor` allows public statuses, owner,
admin, and states "There are NO other exceptions"; the old `previewHomes()` leak is
documented as deleted at `db.ts:317-321`. Queued hands fire at go-live via
`offerQueuedIntroductions` (`actions.ts:904`, called at `:1019`). Test:
`legal-gate.test.ts:192-207` — "does NOT unlock a pre-live home for an accepted
introduction" creates an accepted introduction and asserts the seeker still gets
`undefined`. Passing as of 6 Aug.

**b. "No listing fee. No commission." / no bare free claims — ⚠️ MOSTLY, 3 SURVIVORS.**
The headline is in `CONFIG.copy` (`site.ts:48`) and rendered on the homepage fees
table (`page.tsx:402`), the hush-homes page (`hush-homes/page.tsx:82`) and the seller
agreement (`dashboard/home/[id]/contract/page.tsx:51`). But the grep found survivors:

1. `src/components/home/area-finder.tsx:133` — a CTA button reading **"List your home
   free"**. This is the exact phrasing the brief prohibits.
2. `src/app/page.tsx:205` — "Sellers build their Hush Home's profile, **free**." A
   bare free claim about listing.
3. `src/app/page.tsx:472` — "Join them. It's **free**." Ambiguous, but it sits
   directly above the "List your Hush Home" CTA.

Registration-related uses ("Register free", "Create your free account",
"Quiet Seeker registration — Free") are compliant: registration genuinely is free
with no deferred obligation on that act alone.

**c. Brand palette — ⚠️ MOSTLY, 3 CODE SURVIVORS + PNG ASSETS.**
`src/app/globals.css:18-26` defines Anchor `#3d4f61`, Signal `#e8693a`, Precision
`#3aadda`, and `--color-blue-deep: #1e8fc4` with the documented rule that blue-deep is
for interactive elements/small text and Precision is large fills/decoration only
(`globals.css:11-14`). Survivors of the old orange `#F37C24`:

1. `src/components/match-ring.tsx:8` — the "hot" ring colour is hardcoded `#F37C24`.
2. `src/components/home/concept-reel.tsx:126` — an SVG stroke hardcoded `#F37C24`.
3. `src/components/property-type-icon.tsx:12` — fallback `var(--color-orange, #F37C24)`
   (inert while the variable exists, but stale).

Also: `public/brand/icon.png` and `logo-horizontal.png` are dated 17 July — they
predate the palette switch and still carry the old orange. Re-export is a Phil action.

**d. Trading-name legal footer — ✅ DONE AS SPECIFIED, but now overtaken by events.**
`src/components/site-footer.tsx:9-16` renders "Matchlisted.com is a trading name of
Mowatt – Move Smarter Ltd, registered in Scotland no. [SC______]…" from the `LEGAL`
config block (`site.ts:91-103`), with bracketed placeholders for every fact not yet
supplied. Built exactly as reviewed — and now needs changing per §4 below.

**e. Buyer fee £300 + VAT everywhere, including the worked example — ✅ DONE.**
Single source `BUYER_FEE = 300` (`site.ts:21`). Rendered from that constant at:
homepage fees table `page.tsx:430` and worked example `page.tsx:436-444`
("£300 + VAT = £360… the same on every home at every price"); `quiet-seekers/page.tsx:80-81`;
seeker agreement `dashboard/brief/contract/page.tsx:56-57,106`; offer form
`homes/[id]/offer/page.tsx:186-187`; admin `deals/page.tsx:32,64` and
`invoices/page.tsx:12`; footer link "The £300 buyer fee" (`site-footer.tsx:57`).
No `£495` and no `0.8` anywhere in `src` (the only 495 is a £495,000 sample price).

**f. Demo data reseeded to the current model — ✅ DONE.**
`src/lib/sample-data.ts:877` carries the fixed-£300 buyer-fee invoice; no 0.8%
anywhere in the file. `scripts/seed.mjs` additionally seeds a deferred-model charges
ledger (pending £580 Home Report obligations; `seed.mjs:344-387`). Verified against
the live dev database 6 Aug: 19 charges, 3 invoices, 19 homes.

**g. Legal-gate test extended to sitemap/OG/feeds/exports and the match job — ✅ DONE, one caveat.**
The match-notification email job is tested directly: `legal-gate.test.ts:209-250`
runs both `alertSeekersAboutHome` and `alertSellersAboutBrief` against a rigged
pre-live perfect match and asserts zero notifications and a clean email outbox.
Sitemap/OG/share-image/JSON/RSS/export surfaces are covered by a tripwire
(`legal-gate.test.ts:252-281`): it enumerates every `route.ts`, `sitemap.*`,
`opengraph-image.*`, `twitter-image.*`, `feed.*`, `rss.*` file under `src/app`
against a three-entry allowlist and asserts no `public/sitemap.xml` exists — any new
surface fails the suite until reviewed. Caveat stated honestly: the tripwire catches
route *files*; an admin export built as a server action would not trip it. No admin
export exists today.

---

## 4. STRUCTURAL CHANGE — MATCHLISTED LTD (report only, nothing changed)

Phase 1 was built on the decision that Matchlisted.com is a trading name of Mowatt –
Move Smarter Ltd, inheriting Mowatt's registrations (`site.ts:85-90` records this
explicitly). Incorporating **Matchlisted Ltd as a new company with outside
investment inverts that**: a new company inherits none of Mowatt's registrations.

What this breaks, concretely:

- **The legal identity in code.** `LEGAL` (`site.ts:91-103`) and the footer sentence
  (`site-footer.tsx:9-16`) name the wrong company. Mechanically this is a small fix —
  it is one config block by design — but every value in it changes: company name and
  number, registered office, VAT number, and all four registration numbers, none of
  which can be Mowatt's.
- **Regulatory registrations that must be obtained fresh, before trading:**
  redress scheme membership (legally required for estate agency work), **HMRC AML
  supervision** (estate agency work without it is an offence, and HMRC determinations
  take weeks), ICO registration, VAT registration. The footer currently renders
  these as "to follow" placeholders assuming Mowatt's numbers would drop in — they
  will not.
- **Contracts and policies.** The seller and seeker agreements
  (`CONTRACT_VERSIONS`, `site.ts:110-113`; the contract pages under
  `src/app/dashboard/.../contract/`) bind users to "Matchlisted" — the counterparty
  entity must be defined as Matchlisted Ltd in the solicitor-drafted terms. The
  privacy policy's data controller becomes Matchlisted Ltd.
- **Third-party accounts.** The live Stripe account must be verified under
  Matchlisted Ltd (any verification in progress under Mowatt is the wrong entity).
  Domain, Vercel, Supabase and email-provider ownership should move to the new
  company — lower stakes, but investors will expect it.
- **The Mowatt seeker sheets — the biggest product entanglement.** The 127 live
  Quiet Seekers on `/seekers` are read from Mowatt's Google Sheets
  (`src/lib/mowatt-seekers.ts`), and the UI says so: "Mowatt Matchlist"
  (`mowatt-seeker-card.tsx:163`), "Registered buyer on the Mowatt Matchlist"
  (`seekers/[ref]/page.tsx:165`). Between two separate companies this becomes a
  personal-data transfer: it needs a data-sharing agreement, a lawful basis, and
  possibly seeker consent — a solicitor question, and a commercial one (does Mowatt
  license its buyer list to Matchlisted Ltd?).
- **Rightmove.** The brief already flagged (§13) that Mowatt's Rightmove membership
  may not permit listing under the Matchlisted brand. As a separate company the
  answer is almost certainly that Matchlisted Ltd needs its own membership — this
  bears directly on the Phase 6 Rightmove add-on revenue line.

What does *not* break: the codebase was built for exactly this kind of change — fees,
copy and legal facts are single-source config, and the footer construction survives
("Matchlisted.com is a trading name of Matchlisted Ltd" is still a valid rendering
once `companyName` changes, or the sentence simplifies further).

---

## 5. BLOCKERS, SPLIT BY WHO CAN CLEAR THEM

### PHIL — only you can provide these

1. **Incorporate Matchlisted Ltd and supply the facts**: company number, registered
   office, and (once obtained) VAT number. *Blocks:* the legal footer, the terms,
   every compliance registration below — they all need the entity to exist first.
   This is the head of the critical path.
2. **Apply for redress scheme membership** (TPO or PRS) in Matchlisted Ltd's name.
   *Blocks:* legally doing estate agency work at all; the footer.
3. **Register Matchlisted Ltd for HMRC AML supervision.** *Blocks:* trading legally;
   AML/CDD flows. Long lead time — this cannot wait for the code to be ready.
4. **ICO registration** for the new company. *Blocks:* footer, privacy policy.
5. **Engage the solicitor** (and give them the new-company context): the s.101
   opinion on the Match Report; whether showing Hush Homes to registered seekers is
   "on the market"; terms/privacy/cancellation drafting; the Mowatt→Matchlisted Ltd
   data-sharing agreement for the seeker sheets. *Blocks:* policy pages, Phase 3
   consent screens being final, the Stage-1 product question, keeping /seekers live
   at launch.
6. **Choose and contract the IDV provider** (Thirdfort / Credas / SmartSearch /
   Onfido). *Blocks:* all Phase 3/4 AML build beyond the abstraction layer.
7. **Stripe: verify the live account under Matchlisted Ltd.** *Blocks:* real
   payments; the SetupIntent mandate work can proceed in sandbox meanwhile.
8. **Create the transactional email account (Resend).** *Blocks:* any email leaving
   the outbox — surveyor instructions, match alerts, auth emails at scale.
9. **Surveyor panel**: real instruction inboxes and confirmed fee scales (Allied's
   bands are real; Graham + Sibbald and Shepherd are placeholder copies of Allied's
   scale, and all three point at `.demo` email addresses — `site.ts:147-177`).
   *Blocks:* real Home Report ordering.
10. **Panel solicitor firms and commission terms.** *Blocks:* Phase 5 panel screen.
11. **Re-export the brand PNGs** (`public/brand/icon.png`, `logo-horizontal.png`) in
    the new palette. *Blocks:* item 3c closing fully.
12. **Decisions the brief says not to guess**: does the £300 withdrawal fee stand
    alongside the 12-month longstop; and preferred replacement wording for the two
    ambiguous "free" lines (`page.tsx:205,472`) — the area-finder button
    (`area-finder.tsx:133`) I can fix without you, it just becomes an approved phrase.

### CLAUDE CODE — can start now, nothing needed from Phil

1. **Commit the working tree.** 60 modified files and 13 untracked paths, including
   the entire Phase 1 close-out, both new migrations, the test suite and the brief
   itself, exist only as uncommitted changes on one laptop. Logical commits, today.
   (Pushing to GitHub needs a remote — `gh` isn't installed and no remote is
   configured, so creating the repo needs a one-time step from Phil or an installed,
   authenticated `gh`.)
2. **Fix the close-out survivors**: three "free" claims (b) and three hardcoded
   `#F37C24`s (c).
3. **Note-of-Offer compliance fix**: rename the offer flow surfaces, add the
   non-binding statement (brief §3 — currently "Make your offer" with no disclaimer).
4. **Phase 2**: the public Match Report page (scoring lib and leads table already
   exist, unwired), the multi-step listing builder with quality score, the admin
   approval queue, shadow-listing flow.
5. **Phase 3, sandbox-safe parts**: wire the charge trigger engine (charges are
   currently written by nothing but the seed script), s.18 fee statement screen,
   the two cancellation-consent checkboxes with timestamps, the 14-day notice
   system writing to the outbox, SetupIntent mandates against sandbox Stripe,
   the admin collections view.
6. **Set `goLiveAt`/`expiresAt` on the verify-live transition** — mapped columns
   nothing writes; the longstop can't work without them.
7. **Entity-swap readiness**: keep everything reading `LEGAL` so incorporation day
   is a one-block change (already true; keep it that way).

### EXTERNAL / WAITING — third parties

1. **Solicitor's opinions and drafting** (s.101; "on the market"; terms; data-sharing
   agreement) — waiting once Phil engages them.
2. **HMRC AML supervision determination** — waiting once filed; weeks, sometimes
   months.
3. **Redress scheme approval** — waiting once applied.
4. **Stripe business verification** of Matchlisted Ltd — waiting once submitted.
5. **Surveyor firm contracts** (Allied, G+S, Shepherd) — their fee scales and
   instruction inboxes.
6. **Conveyancing panel agreements** — firms and commission terms.
7. **IDV provider onboarding** — after Phil chooses.
8. **Rightmove** — whether/how Matchlisted Ltd can list; likely needs its own
   membership as a separate company.

---

## 6. CRITICAL PATH TO JANUARY 2027

Five months out. The critical path is **not the code — it is the company-formation
chain**: incorporate → bank account → HMRC AML supervision + redress membership +
Stripe verification. Each step feeds the next, HMRC alone can take 45+ days, and
estate agency work cannot legally begin without it. If the applications aren't filed
by **September**, January is at risk regardless of build progress.

Working back from a mid-January 2027 launch:

- **August (now)** — Incorporate Matchlisted Ltd. Open the bank account. File HMRC
  AML, redress and ICO applications the week the certificate arrives. Engage the
  solicitor with the new-entity brief (including the seeker-sheet data-sharing
  question — it decides whether /seekers survives launch). Choose the IDV provider.
  Meanwhile: commit and push the code, fix the close-out survivors, build Phase 2.
  **Already late:** the repo has no remote and two weeks of uncommitted work — one
  disk failure erases the close-out. **Already late:** solicitor engagement — the
  s.101 opinion shapes the Stage-1 product and was flagged in the brief on 3 August.
- **September** — Phase 2 complete (Match Report public, listing builder, approval
  queue). Start Phase 3 conversions in sandbox: SetupIntent mandates, charge trigger
  engine, s.18 statement, consents, 14-day notices. Resend wired. Solicitor drafts
  in progress.
- **October** — Phase 3 complete including IDV integration (provider must be
  contracted by end-September for this). Phase 4 brief-gates added (AML + approval +
  longstop on the live transition). Stripe verification of the new entity done;
  first live-mode test.
- **November** — Phase 5 brief-shaped (Note of Offer, panel with opt-out and
  commission disclosure, mandate signature, handoff pack, missives cascade onto the
  charges ledger). Phase 6 in whatever scope survives the Rightmove answer.
  Solicitor-approved terms/privacy/cancellation live. Staging environment up.
- **December** — Content freeze, monitoring/Sentry, critical-path tests beyond the
  legal gate, demo-data teardown, launch rehearsal with a real £1 payment made and
  refunded. December is short (holidays) — treat 12 December as the real deadline
  for feature-complete.
- **January 2027** — Soft launch.

**Blunt assessment:** the build volume left (roughly Phases 2–6 in brief shape, with
Phase 4/5 partly banked) fits the timeline with steady weekly sessions. The external
chain has near-zero slack: any second attempt at HMRC, redress or Stripe
verification, or a slow solicitor, pushes January. And the Rightmove question should
be answered before any Phase 6 work is built around that revenue line. The date is
achievable if — and only if — the August paperwork starts this month.

---

## 7. THE NEXT WORK SESSION

What I would do, in order, in the next session:

1. **Commit everything** — the 73-path working tree split into logical commits
   (close-out fixes, migrations + test, policy pages, seed script, docs). Then set
   up the GitHub private repo and push (needs the one-time remote/auth step from
   you if `gh` stays uninstalled).
2. **Close the survivors from §3**: the three "free" claims and the three `#F37C24`
   hexes, then re-run the test suite and redeploy the Vercel preview.
3. **Start Phase 2 with the public Match Report page** — `src/lib/match-report.ts`
   and the `match_report_leads` table are built and waiting; this is the brief's
   "most important screen in the product" and it currently doesn't exist as a page.

What I need from you before that session:

- Nothing for items 1–3 except one small thing: **replacement wording** for
  `page.tsx:205` ("Sellers build their Hush Home's profile, free.") and
  `page.tsx:472` ("Join them. It's free.") if you want something other than the
  approved phrasings from the brief — otherwise I'll use "Nothing to pay upfront."
- To go further than Phase 2, the August items in §5 (incorporation facts, solicitor
  engagement, IDV choice) start to bite — none block the next session itself.
