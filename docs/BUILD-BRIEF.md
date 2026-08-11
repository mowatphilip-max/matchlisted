# Matchlisted.com — Build Brief for Claude Code

> **STALE IN PLACES — `docs/DECISIONS.md` WINS.** This brief is preserved
> verbatim from 3 August 2026. The decision log has since overturned or
> amended parts of it: the £300 withdrawal fee is abolished; conveyancing
> commission is replaced by the firm-ledger case pack fee and panel seat
> (and `charges` is consumer-only); the seller panel is mandatory with a
> price guarantee; a For Sale board add-on exists; consumer prices are
> quoted inclusive of VAT (£360 buyer fee, £240/£354/£120 add-ons); a
> qualified "free listing" claim is permitted; and an offer is never
> conditional on appointing or paying for a solicitor. Read
> `docs/DECISIONS.md` first — where the two disagree, the decision log is
> the build instruction.

Prepared 3 August 2026 · target launch January 2027
Supplied by Phil, 4 August 2026. This is the working brief. Read it end to end
before writing code. Preserved verbatim; tables reconstructed from the paste.

## 0. How to use this brief

- Do not build it all at once. Section 11 gives the build order. Work through it
  phase by phase, and stop at the end of each phase so it can be reviewed.
- Detect the existing stack first. The site already exists and works. Read the
  repo, identify the framework, ORM, styling approach and auth before proposing
  anything. Extend what's there; do not rewrite it.
- Section 3 is load-bearing. It contains a legal gate that must be enforced in
  the data layer, not just the UI. If you're ever unsure whether something
  should be visible, the answer is no.
- Where a number is marked [config], put it in a single config module — every
  fee, threshold and duration in this document will change.

## 1. What Matchlisted is

An off-market residential property matching platform for Scotland, operated by
Mowatt – Move Smarter Ltd.

- Sellers list a Hush Home. No board, no portal, no open viewings.
- Buyers register as Quiet Seekers with a structured brief.
- The Matchlist scores every home against every brief as a Match %. At 90%+
  both sides are told.
- Introductions are private. Identities stay hidden until both sides agree.

Tagline: Where Quiet Seekers meet Hush Homes.
Secondary: Playful about matches. Serious about money.

Brand colours: Anchor #3D4F61 · Charcoal Mid #5F7080 · Signal #E8693A ·
Precision #3AADDA · Ground #F8F8F6.

Voice: quiet, trusted, precise, warm, confident. Short sentences. Every word
earns its place.

## 2. The commercial model

This is the thing to internalise, because most of the build serves it.
Listing is free at the point of use. The Home Report is deferred, not waived.

| Stage | Seller does | Seller pays |
|---|---|---|
| Shadow listing | Enters postcode, beds, type, value band. Sees how many registered Quiet Seekers match. Nothing is visible to anyone else. | Nothing |
| Go live | Orders the Home Report through Matchlisted. Listing becomes visible to registered Quiet Seekers. | Nothing yet |
| Completion | Missives conclude. | Home Report charge, collected by the solicitor from proceeds |
| Withdrawal / lists elsewhere / 12-month longstop | Leaves the platform. | Home Report charge plus £300 + VAT withdrawal fee, collected from the stored card |

Revenue lines:

| Line | Amount [config] | Paid by | Collected |
|---|---|---|---|
| Home Report charge | £580 inc VAT | Seller | Solicitor at settlement, or stored card on withdrawal/expiry |
| Withdrawal fee | £300 + VAT | Seller | Stored card |
| Rightmove listing add-on | £200 + VAT | Seller | Stripe, upfront at purchase |
| Photography add-on | £295 + VAT | Seller | Stripe, upfront at purchase |
| Buyer fee | £495 + VAT, fixed | Buyer | Solicitor at settlement |
| Conveyancing commission | Per panel agreement | Solicitor firm | Invoiced to the firm |

Marketing claim rules — enforce these in copy:

- Never write bare "Free" or "List your home free" for the listing. The seller
  has a deferred obligation, so an unqualified free claim breaches the CAP Code
  and the DMCCA's drip-pricing prohibition.
- Approved phrasings: "Free to list. Pay when you sell." · "Nothing to pay
  upfront." · "No listing fee. No commission. Pay for your Home Report when you
  sell."
- Any surface using one of those phrasings must show the Home Report charge and
  the withdrawal terms on the same screen, not behind a link.

## 3. THE LEGAL GATE — read before writing any listing code

Sections 98 and 101 of the Housing (Scotland) Act 2006 require the marketing
agent to possess a Home Report before communicating a property's availability
to any person. Section 119(4) defines "made public" as communication "to the
public or a section of the public". Registered Quiet Seekers are a section of
the public.

Therefore: **no listing, and no attribute of any listing, may be exposed to any
user other than the property's own owner until the Home Report is received and
verified.**

This means, concretely:

- A shadow listing must never appear in any Quiet Seeker query, search index,
  match list, notification, email, API response, sitemap, or OG image.
- The Match Report shows the seller a count and statistics about matching
  buyers. It never shows any buyer anything about the seller's property.
- Enforce this with a default query scope at the data layer — e.g. a repository
  method or Prisma extension that filters to status IN
  ('live','under_offer','sold') unless an explicit ownerId match or admin role
  is present. Do not rely on individual queries remembering.
- Write a test that asserts a shadow listing is invisible to a seeker account
  across every read path.

Also: in Scotland a binding offer must be made by a solicitor. Anything the
buyer submits on-platform is a Note of Offer — an expression of intent. Never
label it "offer" in a way that implies it binds, and never let it be signed or
accepted as a contract.

## 4. Data model

Extend the existing schema; keep existing tables and names where they already
work.

- **User** — id, name, email, passwordHash (nullable, magic-link primary), role
  (seeker|seller|admin), createdAt. One account may hold both a seller and a
  seeker profile.
- **Listing (Hush Home)** — ownerId, status (see §5), createdAt; address fields
  (postcode, street, town, region) — street is never exposed pre-viewing;
  bedrooms, bathrooms, propertyType, garden, parking, features[]; askingPrice,
  ownerEstimate; description, photos[], floorplanUrl; homeReportId (nullable),
  homeReportOrderedAt, homeReportReceivedAt, homeReportVerifiedAt; goLiveAt,
  expiresAt (goLiveAt + 12 months [config]); approvalStatus
  (pending|approved|changes_requested), approvalNotes.
- **SeekerBrief** — userId, areas[], budgetMin, budgetMax, bedroomsMin,
  bathroomsMin, propertyTypes[], garden, parking, position
  (cash|sold|still_to_sell), mustHaves[], niceToHaves[], notes, isPublic,
  publicRef.
- **Match** — listingId, briefId, score, band (match ≥90 / worth_a_look 50–89 /
  no <50), computedAt, notifiedAt.
- **Charge** — the fee ledger. This is the heart of the money side.
  subjectType/subjectId (listing or transaction), payerUserId; type:
  home_report | withdrawal_fee | rightmove_addon | photography_addon |
  buyer_fee | conveyancing_commission; netAmount, vatAmount, grossAmount;
  status: pending | due | mandated | invoiced | paid | written_off; trigger:
  missives_concluded | withdrawn | listed_elsewhere | longstop | purchased;
  dueAt, collectionRoute (solicitor_mandate | card | stripe_checkout |
  invoice); stripePaymentIntentId, mandateId, notes.
- **Mandate** — listingId/transactionId, solicitorFirmId, signedByUserId,
  signedAt, documentUrl, chargesCovered[], status.
- **SolicitorFirm** — name, address, contacts, commissionTerms, active,
  regions[].
- **Verification (AML)** — userId, provider, providerRef, status
  (pending|passed|referred|failed), type (seller_cdd|buyer_cdd), completedAt,
  expiresAt, riskFlags[].
- **NoteOfOffer** — listingId, buyerUserId, amount, conditions, entryDate,
  status (submitted|accepted_in_principle|declined|withdrawn|formalised),
  solicitorFirmIdBuyer, solicitorFirmIdSeller.
- **Viewing** — listingId, seekerUserId, slotId, status.
- **AddOnPurchase** — listingId, type, stripeSessionId, status, fulfilledAt,
  supplierRef.
- **AuditLog** — actorId, action, subjectType, subjectId, meta, at. Log every
  Home Report download, every status change, every charge state change. You
  will need this if Trading Standards ever ask.

## 5. Listing lifecycle

```
draft ──> shadow ──> hr_ordered ──> live ──> under_offer ──> sold
             │            │           │           │
             └────────────┴───────────┴───────────┴──> withdrawn
                                      │
                                      └──> expired  (12 months after goLiveAt)
```

Visibility: live, under_offer and sold are visible to registered Quiet
Seekers. Everything else is visible only to the owner and admins. No
exceptions.

| Transition | Side effects |
|---|---|
| draft → shadow | Compute Match Report. No charges. |
| shadow → hr_ordered | Create home_report Charge with status pending. Instruct the panel surveyor. Capture the early-start consent (§9). Take the card mandate (§7). |
| hr_ordered → live | Only when Home Report is received and admin-verified and listing approved and seller AML passed. Set expiresAt. Run full match. Notify 90%+ matches both sides. |
| live → under_offer | On accepted_in_principle Note of Offer. |
| under_offer → sold | Admin marks missives concluded. Set all pending Charges to due, trigger missives_concluded, route to solicitor_mandate. |
| any → withdrawn | Set home_report Charge due with trigger withdrawn, route card. Create withdrawal_fee Charge due, route card. Give 14 days' notice before charging (§7). |
| live → expired | Same as withdrawn but trigger longstop, and no withdrawal fee. Offer a renewal path that resets expiresAt and defers the charge. |

"Listed elsewhere" is detected by seller declaration or admin flag, and is
treated exactly as withdrawn. Note that a Rightmove listing purchased through
Matchlisted as an add-on is not listing elsewhere — the seller remains
exclusive to the platform. Make sure the rule cannot fire on your own add-on.

## 6. Pages and flows

### 6.1 Seller: the Match Report (the most important screen in the product)

Public, no account required, four inputs: postcode or town · bedrooms ·
property type · value band. Returns immediately:

- Number of registered Quiet Seekers whose brief matches
- How many are cash buyers or have no dependent sale
- The single highest Match %
- One anonymised brief snippet, partially obscured
- CTA: "Create a free account to read all 31 briefs"

Empty state must be honest. If nothing matches: "No Quiet Seekers match your
home yet. 3 are looking in the Highlands. We'll email you the moment one does —
it's free to be first in the queue." Capture the email. Never fabricate a
count.

This screen is the destination for every seller-side advert. It must be fast,
mobile-first and card-free.

### 6.2 Seller: listing builder

Multi-step, saves progress, works on mobile. Steps: property basics →
description → photos → price → availability → review.

Free tier means the seller writes it and uploads their own photos. Provide
inline guidance and a live quality score (photo count, resolution, description
length, floorplan present). At the end, offer the photography add-on — this is
the natural upsell moment.

Admin approval is a hard gate. Minimum standards [config]: ≥6 photos, ≥1200px
on the long edge, description ≥150 words, no visible people, no contact
details in text or images. Approval queue with approve / request-changes and a
templated reason.

### 6.3 Seller: go live

Shows the Match Report for their actual property, then:

> 31 Quiet Seekers match your home. 9 are cash buyers. To be introduced, we
> need your Home Report. It costs £580 including VAT — and you don't pay a
> penny until you sell. If you withdraw or list elsewhere, it becomes payable
> then, along with a £300 + VAT withdrawal fee.

Requires, in this order: early-start consent (§9) → card mandate (§7) → AML
verification (§8) → confirm.

### 6.4 Seller: dashboard

Listing status and a clear next action · live match list with Match % (buyers
anonymised) · viewing requests and diary · Notes of Offer · charges ledger
showing what's owed and when it falls due · add-on store · document vault.

The six-week nudge. If a listing is live for 42 days [config] with no 90%+
match, surface a designed prompt: "No match yet. Some homes just need a wider
audience. Go public on Rightmove for £200 + VAT — you stay listed with us, and
nothing else changes." This is a real revenue moment; build it as a
first-class flow, not a banner.

### 6.5 Buyer: brief builder

Must be startable without an account. Location → budget → beds → position →
extras, with a live counter ("Matching 8 Hush Homes…"). Ask for the email only
at the end to save it. Then email-first signup with magic link, plus Continue
with Google and Apple. Password optional and set later.

### 6.6 Buyer: dashboard

Matches with Match % · saved homes · Home Report downloads (registered seekers
only, every download logged) · viewing requests · Notes of Offer · brief
editing · alert preferences.

### 6.7 Notes of Offer and solicitor handoff

- Buyer submits a Note of Offer: amount, conditions, proposed date of entry.
  UI must state plainly that this is not a binding offer and that a solicitor
  will formalise it.
- Seller accepts in principle, declines, or counters.
- On acceptance, both parties are shown the recommended panel with quoted
  fees. Presented as a strong default with a clearly visible "I'll use my own
  solicitor" option. Commission disclosure appears on this screen: "We receive
  a fee from panel solicitors when you instruct them. You are free to use any
  solicitor you wish."
- Both parties complete AML if not already done.
- Mandate is generated and signed — authorising the solicitor to settle
  Matchlisted's charges from the proceeds.
- Handoff pack is sent to both firms: Home Report, listing details, Note of
  Offer, mandate, contact details.
- Admin marks missives concluded, which fires the charge cascade.

### 6.8 Add-on store

Rightmove listing £200 + VAT · Professional photography £295 + VAT. Both
charged upfront via Stripe Checkout at the point of purchase — not deferred.
Fulfilment status tracked; photography creates a supplier task with the
seller's contact details and preferred dates.

### 6.9 Public SEO surfaces

- /seekers/[ref] — individual public buyer briefs (already exists). Add a
  generated branded OG share image per brief and a "Recognise your home?" CTA
  into the Match Report.
- /looking-in/[town] — auto-generated hub for every town with ≥3 live seekers
  [config]. H1: "14 buyers are quietly looking in North Berwick." Budget
  distribution, cash-buyer count, anonymised briefs, one CTA.

These are the compounding acquisition engine. Give them proper schema markup
and unique meta descriptions.

## 7. Payments

Stripe. Two distinct mechanisms — do not conflate them.

- (a) Upfront charges — add-ons only. Stripe Checkout, charged immediately,
  receipt emailed.
- (b) Contingent charges — Home Report and withdrawal fee. At go-live, take a
  SetupIntent with usage: 'off_session' to store the card as a mandate for
  merchant-initiated transactions. SCA is completed at setup, not at charge
  time.

Collection routing:

| Trigger | Route |
|---|---|
| missives_concluded | Solicitor mandate. Invoice the firm at settlement. Never charge the card. |
| withdrawn | Stored card, after 14 days' written notice [config] |
| listed_elsewhere | Stored card, after 14 days' written notice |
| longstop | Stored card, after 14 days' written notice |
| Buyer opted out of the panel | Fall back to stored card or manual invoice |

Rules to implement:

- Every card charge sends a notice email 14 days before with the amount, the
  reason and the date. This is the single most effective defence against a
  chargeback. Log the notice in AuditLog.
- If the card fails, the charge does not disappear — it moves to invoiced and
  enters a dunning sequence. The contractual debt survives independently of
  the card.
- Never store raw card details. Stripe customer + payment method reference
  only.
- Build an admin view of every Charge with filters by status, age and route.
  This is Phil's collections screen.

## 8. AML / identity verification

Estate agency work supervised by HMRC requires customer due diligence on both
the seller and the buyer.

- Integrate a UK property IDV provider (Thirdfort, Credas, SmartSearch or
  Onfido — abstract behind an interface so it can be swapped).
- Seller CDD must pass before a listing can go live.
- Buyer CDD must pass before a Note of Offer can be accepted in principle.
- Store status, provider reference, completion date and expiry. Re-verify
  after 12 months [config].
- Failed or referred cases go to an admin review queue — never auto-reject.
- Source of funds questions for cash buyers.

## 9. Compliance surfaces to build

- Legal footer, sitewide: company name and number, registered office, VAT
  number, redress scheme membership, ICO registration, links to Terms,
  Privacy, Cookies, Complaints.
- Pre-contract fee statement (Estate Agents Act 1979 s.18). A standalone
  screen shown before the seller commits, listing every charge, its amount,
  when it falls due and who pays. Must be acknowledged and the acknowledgement
  timestamped. Failure to give this makes the agreement unenforceable without
  a court order — treat it as a hard gate.
- Connected persons disclosure (s.21). Plain-language statement that
  Matchlisted earns a margin on Home Reports and may receive a fee from panel
  solicitors.
- Cancellation rights. 14-day cancellation for distance contracts. Two
  separate, unticked, affirmatively-selected acknowledgements at go-live:
  - ☐ I want Matchlisted to start work straight away, within my 14-day
    cancellation period, by instructing my Home Report now.
  - ☐ I understand that if I cancel after my Home Report has been delivered, I
    will still have to pay £580, and I will keep the Home Report.
  Neither may be pre-ticked. Store both selections with timestamps. Provide
  the model cancellation form as a downloadable and as an in-product action.
  If the seller does not give this consent, do not instruct the surveyor until
  day 15.
- Cookie consent defaulting to decline for non-essential.

## 10. Matching algorithm

Preserve the existing weighting, which is already published on the site:
location 35%, price vs budget 25%, then bedrooms, property type, bathrooms,
garden and extras.

Bands: ≥90% "It's a match" (both sides notified) · 50–89% "Worth a look" ·
<50% not surfaced.

Recompute on: new listing going live, brief created or edited, price change.
Notify at most once per pairing. Batch notification emails; never send more
than one match email per user per day [config].

## 11. Build order

Stop at the end of each phase for review.

- **Phase 1 — Foundations and the legal gate.** Legal footer and policy pages ·
  fix the £0 – £0 budget bug on seeker detail pages · nav/IA fix (For buyers →
  /quiet-seekers, For sellers → /hush-homes, Who's looking → /seekers) · the
  data-layer visibility scope from §3 plus its test · Charge and AuditLog
  models.
- **Phase 2 — The seller funnel.** Match Report (public) · listing builder ·
  shadow listing · admin approval queue · seller dashboard v1.
- **Phase 3 — Money and identity.** Stripe upfront and SetupIntent mandates ·
  charge ledger and trigger engine · 14-day notice system · s.18 fee statement
  · cancellation consents · AML integration · admin collections view.
- **Phase 4 — Go live and matching.** Home Report ordering and verification ·
  live transition with all its gates · match computation and notifications ·
  viewing requests and seller diary · buyer dashboard.
- **Phase 5 — Offers and solicitors.** Note of Offer flow · panel presentation
  with opt-out and commission disclosure · mandate generation and signature ·
  handoff pack · missives-concluded cascade.
- **Phase 6 — Add-ons and growth surfaces.** Add-on store · six-week Rightmove
  nudge · photography supplier workflow · town hub pages · seeker OG share
  images · email-first signup with Google and Apple.

## 12. Non-negotiables

- Nothing pre-live is ever visible to a Quiet Seeker. Enforced at the data
  layer, with a test.
- Never render an unqualified "free" claim for the listing.
- A Note of Offer is never presented as binding.
- The 14-day pre-charge notice always sends before any card is charged.
- Every Home Report download is logged with user, listing and timestamp.
- The panel is a recommendation, not a requirement — the opt-out must be as
  visible as the accept.
- Keep the existing accessibility work: skip links, ARIA labelling, the
  animation pause control. Add to it; don't regress it.
- Mobile first. Verify at 390px and 430px. Meta traffic will be 80%+ mobile.

## 13. Open items — do not invent answers

Flag these and ask rather than guessing:

- Whether the seller-only Match Report is a "qualifying action" under s.101 —
  a solicitor's opinion is being sought. Until it returns, build it exactly as
  specified in §3.
- Whether the 12-month longstop and the £300 withdrawal fee can both stand —
  under review. Both are [config] so either can be switched off.
- Company number, registered office, VAT number, redress scheme and ICO
  registration numbers for the legal footer.
- Which surveyor firm and which IDV provider.
- Panel solicitor firms and their commission terms.
- Whether the existing Rightmove membership permits listing under the
  Matchlisted brand — their product guidelines require the property to be
  instructed at the specific member location.
