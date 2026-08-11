# Matchlisted — Decision log

**Purpose.** This file is the authoritative record of product, pricing and legal decisions.
Where it conflicts with `docs/BUILD-BRIEF.md`, **this file wins** until the brief is rewritten.

**Read this before starting any build session.** Two of the brief's own §12 "non-negotiables"
have been overturned and a session working from the brief alone will build the wrong behaviour.

Last updated: 10 August 2026.

---

## 0. Superseded rules — read first

| Build brief says | Actual position | Decided |
|---|---|---|
| §12 "Never render an unqualified *free* claim for the listing" | **Overturned.** "List your house for free" is permitted, subject to the four conditions in §1 below. | 10 Aug 2026 |
| §12 "The panel is a recommendation, not a requirement — the opt-out must be as visible as the accept" | **Overturned.** The conveyancing panel is **mandatory** for Hush Home sellers, paired with a quoted fixed-fee price guarantee. See §6. | 10 Aug 2026 |
| §1 "No board, no portal, no open viewings" | **Amended.** A For Sale board is now a paid add-on. A Hush Home is private *by default*; the add-ons are the volume knob. | 10 Aug 2026 |
| §13 open item 2 — "whether the 12-month longstop and the £300 withdrawal fee can both stand" | **Resolved.** Withdrawal fee abolished. Longstop stands. | 10 Aug 2026 |

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
| Rightmove add-on | **£240** | Stripe, upfront |
| Photography add-on | **£354** | Stripe, upfront |
| **Board add-on** | **£120** | Stripe, upfront. NEW — needs a supplier workflow modelled on photography's |
| **Buyer fee** | **£360, flat** | Solicitor at settlement |
| **Case pack fee** | **£150 + VAT, B2B** | Invoiced to the panel firm on `pack_delivered` — see §6 |
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
