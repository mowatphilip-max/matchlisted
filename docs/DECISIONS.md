# Matchlisted — Decision log

**Purpose.** This file is the authoritative record of product, pricing and legal decisions.
Where it conflicts with `docs/BUILD-BRIEF.md`, **this file wins** until the brief is rewritten.

**Read this before starting any build session.** Two of the brief's own §12 "non-negotiables"
have been overturned and a session working from the brief alone will build the wrong behaviour.

Last updated: 11 August 2026 (Rightmove membership, §4a).

Pitch-side decisions — narrative, valuation, deck structure, what we claim to investors and how we
defend it — live in `docs/PITCH.md`, not here.

---

## 0. Superseded rules — read first

| Build brief says | Actual position | Decided |
|---|---|---|
| §12 "Never render an unqualified *free* claim for the listing" | **Overturned.** "List your house for free" is permitted, subject to the four conditions in §1 below. | 10 Aug 2026 |
| §12 "The panel is a recommendation, not a requirement — the opt-out must be as visible as the accept" | **Overturned.** The conveyancing panel is **mandatory** for Hush Home sellers, paired with a quoted fixed-fee price guarantee. See §6. | 10 Aug 2026 |
| §1 "No board, no portal, no open viewings" | **Amended.** A For Sale board is now a paid add-on. A Hush Home is private *by default*; the add-ons are the volume knob. | 10 Aug 2026 |
| §13 open item 2 — "whether the 12-month longstop and the £300 withdrawal fee can both stand" | **Resolved.** Withdrawal fee abolished. Longstop stands. | 10 Aug 2026 |

---

## 0.5 OUTSTANDING DEFECT — fix before the Track B rework

**The offer flow conditions a buyer's ability to make an offer on appointing and paying for
a lawyer through the platform** (`src/app/homes/[id]/offer/page.tsx`, echoed on the
quiet-seekers page and the seeker contract page). Found 11 Aug 2026 during the Track B survey.

This is **conditional selling**. The Estate Agents (Undesirable Practices) (No. 2) Order 1991
makes it an undesirable practice to discriminate against a prospective purchaser "on the
grounds that that purchaser will not be, or is unlikely to be, accepting services", and
NTSEAT names *imposing additional conditions on offer submission* as a specific example.
It is a **trigger event** under the Estate Agents Act 1979 — NTSEAT can prohibit an
individual from estate agency work — and the code is live on a deployed site.

**The seller mandate and the buyer condition are not the same thing.** A mandated panel for
the *seller*, paired with a price guarantee, is defensible (§6). Any condition on the *buyer*
is not defensible at all, on any terms, ever.

**Fix:** a buyer must be able to submit a Note of Offer with no lawyer appointed and nothing
paid. Appointing a solicitor comes after acceptance, and the £100 deposit tied to it should
be removed rather than re-labelled — do not spend effort making it VAT-inclusive until its
fate is decided.

---

## 1. The "free" claim — permitted, with four conditions

**"List your house for free" may be used.** CAP/BCAP guidance permits a free claim where the
customer must buy something else, provided liability is clear, quality isn't reduced, and the
required purchase's price hasn't been inflated to fund the free item. The Home Report is a
statutory requirement of selling in Scotland, not a Matchlisted charge.

The £580 is **below market** for every band above £300k (typical: £720–£900 at £300–400k,
£840–£1,080 at £400–500k, £1,080–£1,200 above £500k; Scottish average £433). Keep a dated copy
of those market rates beside the ad file — that is the entire defence of rule 3.24.2.

**Four conditions, all mandatory:**

1. Total liability appears **on the same screen** as the word "free" — never in a footer.
2. The market-rate evidence is kept, dated, and refreshed annually.
3. **Every consumer-facing figure is quoted inclusive of VAT.** No "+ VAT" anywhere a seller
   can see it. (The ASA rejected an estate agent's "0.9% + VAT" as misleading.)
4. It is stated that the Home Report is payable **whether or not the property sells**.

Do not run the free claim hard at audiences below ~£200k, where £580 is at or above market.

---

## 2. Pricing — all figures inclusive of VAT

| Line | Price | Collection |
|---|---|---|
| Home Report | **£580** | Solicitor at settlement; **stored card, 14 days' written notice**, on withdrawal / listed elsewhere / longstop |
| Withdrawal fee | **ABOLISHED** — was £300 + VAT | — |
| Rightmove add-on | **£240** | Stripe, upfront. **Matchlisted lists under its OWN Rightmove membership** — see §4a |
| Photography add-on | **£354** | Stripe, upfront |
| **Board add-on** | **£120** | Stripe, upfront. NEW. No photography workflow exists yet to copy — config and schema only for now; the fulfilment path is built once, in Phase 6, and photography and Rightmove reuse it |
| **Buyer fee** | **£360, flat** | Solicitor at settlement |
| **Case pack fee** | **£150 + VAT, B2B** | Invoiced to the panel firm on `pack_delivered`. **Firm ledger, not `charges`** — see §6 |
| **Panel seat** | Fixed annual, per firm | B2B invoicing, monthly. **Not a `Charge`** — see §6 |

**The draft seller agreement says the buyer fee is 0.8%. That is wrong and must be corrected
before anyone signs it.** Question 10 of the solicitor drafting brief is also written around
0.8% and needs rewriting.

Home Report supplier cost is modelled at £400 inc VAT (~31% gross margin). **Unconfirmed** —
negotiation in progress as at 10 Aug 2026.

---

## 3. Withdrawal

On withdrawal, listing elsewhere, or the 12-month longstop the seller owes **the £580 Home
Report charge and nothing else.** Collected from the stored card after 14 days' written notice.

*Rationale: the solicitor brief flagged that the two charges together may be challengeable as a
penalty under the Consumer Rights Act. Removing the second charge removes the argument, and
there is no arbitrage risk because £580 is roughly market for a Home Report.*

Remove `withdrawal_fee` from the charge types, from the go-live copy, and from seller
agreement cl. 6.2.

---

## 4. Listings

**Address release.** The property address is shown to a Quiet Seeker **only once a viewing has
been booked** — not on match, not on seller acceptance. Confirms seller agreement cl. 2.2 and
the existing data model (`street` never exposed pre-viewing).

**Price format: "Offers over £X".** The seller sets it in the listing builder.

- Offers over is a **floor**, which maps cleanly onto `buyer budget >= floor` for match scoring
  (price carries 25% of the match score).
- **Build rule:** registered Quiet Seekers can read the Home Report valuation. Warn the seller
  in the listing builder when the offers-over figure is **more than ~10% below** the Home
  Report valuation — a large gap invites a question and edges toward a misleading action under
  the CPRs.
- Matchlisted must never appear to value a property. Any steer is market information
  ("homes like yours in EH39 have sold at…"), never an opinion of value.

**Board add-on.** A Hush Home is private by default and the add-ons are the volume knob:
Rightmove takes the seller public online, a board takes them public locally, both by choice.

---

## 4a. Rightmove — Matchlisted's own membership

**Decided 11 August 2026.** Matchlisted Ltd holds its own Rightmove membership and lists as
Matchlisted. **It does not list under Mowatt's membership**, and no material may claim that it does.

Why the previous assumption failed. Rightmove's published Product Guidelines require the branch
advertising a property to have *"received an instruction at Your Location to which the Featured
Property is allocated"*, and the Additional Profile product — the only route to a second listing
profile — requires that profile to *"share the same legal entity as Your Parent Branch"* and trade
from the same address. Rightmove has separately refused a joint listing between a member and a
non-member firm on the ground that *"agents cannot re-sell Rightmove services to other agents"*,
requiring the listing agent to hold the vendor instruction and handle all enquiries itself.
Matchlisted Ltd is a separate legal entity holding its own instructions, so Mowatt could not
lawfully list its stock under Rightmove's own rules.

**Build and planning consequences:**

- **Rightmove membership is a fixed annual cost, not a per-listing marginal one.** Remove any
  `£25 marginal cost` assumption. Modelled at £12,000 in 2027 rising to £18,000 by 2032 —
  an estimate until membership quotes it.
- **Rightmove requires redress scheme membership**, so the add-on cannot go live until Matchlisted
  holds redress. **It sits on the same critical path as incorporation, HMRC AML and ICO, and may
  not be available at the January 2027 launch.** The listing builder must be able to hide or
  waitlist the add-on without a code change — a config flag, like the other add-ons.
- Rightmove has historically priced online and hybrid agents differently from high-street branches.
  A single office advertising across all of Scotland may not be priced as one branch. Confirm
  before relying on the cost.
- Mowatt's Rightmove membership still matters — it covers **Mowatt's own instructions**, which is
  the premium tier. It is not a launch de-risker for the Matchlisted add-on.

**Alternative, if the add-on has to ship before redress:** the seller taking the Rightmove route
instructs **Mowatt** and becomes a Mowatt open-market client, with Mowatt listing its own
instruction and handling enquiries. That is compliant, but it is a different product with different
economics — not a £240 add-on to a Hush Home Listing — and must be presented as such.

---

## 5. AML / identity

Provider decision rule: **cheapest.**

Refinement recorded but not yet actioned: cheapest *among providers the panel firms will
accept*. If the solicitors will not rely on the check, the AML component of the case pack loses
its value and the £150 pack fee is harder to defend — roughly £141k a year at 2032 volumes,
against maybe £5k of annual saving on check pricing.

Seller CDD must pass before a listing can go `live`. Buyer CDD before completion.

---

## 6. Conveyancing — the panel and how Matchlisted is paid

### Never charge commission per introduction

Law Society of Scotland **rule D9.2** prohibits a solicitor sharing fees with an unqualified
person. The Professional Practice Committee names the primary prohibited arrangement as
*"an arrangement to pay commission for the introduction of business on a case by case basis"*.

**£250 per lead is a specific sum per referral and must not be used**, even where a firm offers
it. Fixed versus percentage makes no difference — the guidance names both. Scotland differs
from England here; disclosure does not fix it.

### The two permitted structures

**A · Case preparation fee — £150 + VAT per case.**
Permitted as a genuine service ("real, not merely client introduction"). Priced to the work
saved: file opening, AML on both sides, chasing the Home Report, taking instructions — roughly
two to four fee-earner hours.

- **Trigger is `pack_delivered`, never `missives_concluded`.** A fee payable on completion is
  transaction commission however it is labelled. This is the single most important detail.
- Log every delivery in `AuditLog`.
- **Never refundable on fall-through.** Contingency makes it commission again.
- Rename `conveyancing_commission` → `case_pack_fee`.

**B · Panel membership — fixed annual fee per firm, by territory.**
Permitted "provided that that fee is not expressed as a specific sum per referral or as a
percentage… A flat fee is not in breach of the rules and that may be a fee which is reviewed
periodically."

- **Never index it to volume in-year.** No bands, no true-up, no rebate for under-delivery.
- Fixed for twelve months, renegotiated at renewal.
- **A panel seat is not a `Charge`.** It is B2B invoicing against a firm. Needs a new
  `PanelFirm` model: territory, seat fee, invoicing schedule, renewal date.

### Where the money sits in the data model

**Consumer charges and firm invoices are separate ledgers. Do not merge them.**

The `charges` table carries consumer-protection machinery — 14-day pre-charge notices,
cancellation rights, stored-card mandates, s.18 disclosure. None of that applies to a
business invoice to a law firm.

- **Consumer side (`charges`)** — Home Report, add-ons, buyer fee. The payer is always a user.
- **Firm side (its own table)** — the case pack fee *and* the panel seat. The payer is always
  a `PanelFirm`. Carry a nullable `listing_id` on the pack fee so per-listing revenue stays
  reportable.

**Do not make `charges.payer_user_id` nullable to accommodate a firm payer.** A polymorphic
payer on the table that governs consumer protection is how a 14-day consumer notice ends up
addressed to a law firm — or, far worse, how a consumer silently misses one.

### The mandate

The panel is **mandatory** for Hush Home sellers, and must be paired with a **quoted, fixed,
guaranteed fee shown prominently before signature.** The guarantee is what makes the mandate
defensible under Consumer Rights Act 2015 Part 2 — a bare restriction, while Matchlisted is
paid by the mandated firm, is close to the paradigm unfair term. It is not an afterthought;
it ships with the mandate or the mandate does not ship.

Disclose the connection under Estate Agents Act s.21. Disclose the commitment under s.18,
before the seller commits.

### Absolute limits

- **Never condition anything on the buyer** — not viewings, not address release, not whether an
  offer is passed on. Estate Agents (Undesirable Practices) (No. 2) Order 1991. It is a trigger
  event and NTSEAT can prohibit an individual from estate agency work.
- Buyer-side panel take-up stays voluntary. Model at ~50%, never 100%.
- Paper it as **two agreements** — a services agreement (pack specification and SLA) and a
  panel licence (territory). Never one document, and never the word "commission".

---

## 7. Open items — do not invent answers

1. **s.101 Housing (Scotland) Act 2006** — is the seller-only Match Report a qualifying action?
   Solicitor's written opinion still outstanding. Build exactly as specified in brief §3.
2. **Home Report supplier** — name and rate unconfirmed.
3. **Panel firms' fixed fee to the seller** — sets the price guarantee. Proposal issued 10 Aug.
4. Company number, registered office, VAT number, redress scheme and ICO registration numbers
   for the legal footer. **The new entity inherits none of Mowatt's registrations.**
5. Does the case pack fee satisfy the D9.2 genuine-services exception as specified?
   *(New solicitor question.)*
6. Does a mandated panel clause paired with a stated price guarantee survive CRA 2015 Part 2?
   *(New solicitor question.)*

---

## 8. Related documents

These live in `Documents/Claude/Projects/Matchlisted.com`, not in this repo:

- `matchlisted-faq-corrected-answers.html` — nine seller FAQ answers, copy-ready
- `matchlisted-conveyancing-locked-panel.html` / `.xlsx` — the panel model, all inputs editable
- `matchlisted-panel-partnership-proposal.docx` — the proposal issued to the two firms
- `matchlisted-build-plan-jan-2027.html` — tracks, sequence and session estimates
- `matchlisted-outdoor-concepts.html` — "Name Your Number" and the pre-launch surfaces
- `matchlisted-video-concepts-round2.html` — the film campaign

**Campaign assets that contradict the board add-on and must be reworked:** outdoor platform D
("The Board Says More Than You Think" — retire it), platform E's "No board. No portal." line,
and film concept D ("The Sign That Never Went Up").
