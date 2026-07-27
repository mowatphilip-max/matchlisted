# Matchlisted — Go-Live Audit

**Audited:** 27 July 2026 · **Audited by:** Claude (Anthropic) for Phil Mowat
**Scope:** read-only audit of the repository, the local build and the public preview deployment. Nothing was changed, no live service was touched, no customer data was copied or committed.

---

## 1. Executive summary

Matchlisted is a convincing, well-built **prototype**, but it is not a product yet. It cannot go live as it stands.

The single biggest risk is that **nothing is permanently stored**. Every registration, order, payment record and uploaded document lives in the site's temporary memory and is wiped every time the site restarts or is updated — which happens on every deploy and routinely on its own. There is no database.

Right behind that: the **admin area has no password** (a guessed web-browser cookie opens the full back office), **Home Report PDFs are never actually saved** (the upload keeps the filename and discards the file), **no email is ever really sent**, and **payments do not exist in any form**.

The good news: the underlying craft is sound. The Home Report *download permission check* is genuinely correct, the seeker data reads live from your real sheets, no secrets have leaked into the code history, and the site is fast and looks the part.

**Realistically this is 8–13 weeks of work** before a responsible launch, most of it on the four foundations above rather than on features.

---

## 2. Blockers — cannot responsibly go live without these

Ordered by what must happen first.

### 2.1 Put in a real database
**What it is:** Today all data lives in the computer's short-term memory ("in-memory store" — a scratchpad, not a filing cabinet). Restart the site and every seller registration, order, introduction and payment record vanishes. The Supabase schema exists as a written plan but is not connected to anything.
**Why it matters:** You would take a customer's money and lose the order minutes later.
**Who:** Me (build) · **You** (open the Supabase account).
**Effort:** Multiple days (roughly 4–6 days) for the database plus moving every screen onto it.
**Depends on:** Nothing — this is the first job. Everything else in this list depends on it.

### 2.2 Real login and passwords, and lock the admin area
**What it is:** There are no passwords anywhere. Sign-in is a row of one-click "demo persona" buttons — including **"Phil — admin"** — and this is live on the public preview URL right now. I verified that simply setting a browser cookie to a guessed value (`ml_uid=u-phil`) opens the entire back office: introductions, the email outbox, purchase orders, every user.
**Why it matters:** Anyone who finds the URL is an administrator.
**Who:** Me (build) · **You** (decide who gets admin accounts).
**Effort:** Multiple days (2–3 days) using Supabase's built-in login.
**Depends on:** 2.1.

### 2.3 Store Home Report PDFs properly — they are currently thrown away
**What it is:** When a seller uploads their completed Home Report, the code records the **file name only** and discards the actual PDF. The "download" link then serves a placeholder text file that says it's a placeholder. There is no file storage anywhere in the project.
**Why it matters:** The core promise of the product — buyers can download the Home Report — does not work, and sellers would believe they had delivered a document they hadn't.
**Who:** Me (build) · **You** (Supabase Storage is part of the same account as 2.1).
**Effort:** Multiple days (2–3 days) including permission checks and expiring links.
**Depends on:** 2.1.
**Credit where due:** the *permission logic* around it is already correct — see §3.2.

### 2.4 Remove the developer back doors from the public site
**What it is:** Two maintenance URLs are live on the public deployment with no password: `/api/dev/reset` **wipes and reseeds all data for anyone who visits it**, and `/api/dev/seeker-mapping` returns the full seeker dataset as raw data. There is also a `/dev/icons` page.
**Why it matters:** A stranger can delete your data by loading a web address.
**Who:** Me. **Effort:** Under an hour. **Depends on:** nothing — quickest win here.

### 2.5 Build card payments (Stripe Checkout)
See §6 for the full specification. Nothing exists today: the "Pay" button just marks the invoice paid in memory.
**Who:** Me (build) · **You** (open and verify the Stripe account).
**Effort:** Multiple days (4–6 days) including the unhappy paths and a full rehearsal.
**Depends on:** 2.1 (an order must exist in a real database before money moves), and your Stripe verification completing.

### 2.6 Make emails actually send
**What it is:** Every email in the system — surveyor instructions, receipts, "you have a possible match" alerts — is written to an in-memory list shown at `/admin/emails`. No email software is installed. Nothing has ever left the building.
**Why it matters:** You would instruct a surveyor who never hears from you, and send a receipt no one receives.
**Who:** Me (build) · **You** (open an email-sending account, e.g. Resend, and confirm the sending address).
**Effort:** A day, plus DNS records (§8.4).
**Depends on:** 2.1, and domain DNS access.

### 2.7 Privacy policy, cookie consent, ICO registration and data agreements
**What it is:** The site holds real personal data (seeker profiles, seller property details, and soon Home Reports containing full addresses and valuations) and has **no privacy policy, no terms, no cookie banner** — those pages return "not found". The UK Information Commissioner's Office registration (an annual fee, typically £52 for a small company) and written data-processing agreements with Stripe, Supabase, Vercel and the email provider are also missing.
**Why it matters:** This is a legal obligation, not a nicety, and you already hold real people's data.
**Who:** **You** (with a solicitor for wording; the supplier agreements are usually click-to-accept) · Me (build the pages and the banner once wording exists).
**Effort:** You: a day of decisions plus solicitor time. Me: a day to implement.
**Depends on:** knowing which suppliers you're using — so settle 2.1/2.5/2.6 first.

### 2.8 A cancellation and refund policy, written before the first payment
**What it is:** Consumer distance-selling rules give buyers a cancellation window, which sits awkwardly with a service that starts immediately (you instruct the surveyor the moment they pay). You need a written policy, shown before payment, covering what happens if they cancel after you've instructed the surveyor.
**Why it matters:** Without it you may be obliged to refund in full even after paying the surveyor.
**Who:** **You** + solicitor. Me to display it at checkout. **Effort:** Solicitor time; an hour for me.
**Depends on:** nothing — can start now, and it gates 2.5.

### 2.9 Point matchlisted.com at the site, and stop the preview URLs being public
**What it is:** You already own **matchlisted.com** — it currently redirects to mowatt.uk. The prototype lives on a Vercel preview address that is **public to anyone with the link**, and preview deployments carry real seeker data.
**Why it matters:** Real data on guessable public URLs, and an unfinished site anyone can find and judge.
**Who:** Me (configure) · **You** (approve moving the domain away from its current redirect; Vercel password protection for previews is a paid plan feature — a purchase decision).
**Effort:** A few hours plus DNS propagation.
**Depends on:** deciding what should happen to the current matchlisted.com → mowatt.uk redirect.

---

## 3. Ground truth — what is actually here

### 3.1 The stack
| | |
|---|---|
| Framework | Next.js 16.2.9 (React 19.2.4, TypeScript 5.9.3), package manager npm |
| Styling | Tailwind CSS v4 with a proper design-token layer |
| Hosting | Vercel, project `matchlisted-hush-7482`, deployed from a laptop by command |
| Environments | **Production only in name.** No staging. No automatic deployment from git. |
| Database | **None connected.** In-memory store; Supabase schema written but unused |
| Version control | Git, initialised 26 July 2026, 6 commits, local only — **not backed up to GitHub** |
| Dependencies | **3 high-severity advisories** in `sharp`/`postcss` (image handling), fixable by a routine upgrade to Next 16.2.12. Nine packages behind. |
| Secrets | Clean — no keys in the code or its history; `.env*` correctly excluded |

**Backups and restore:** there is nothing to back up, because nothing is stored. Once the database exists, backups and a *tested* restore become a launch requirement — nobody has ever tested a restore because there has never been a database.

### 3.2 What is real vs. scaffolding
**Genuinely real:** the Quiet Seekers directory (reads your live Google Sheets, 142 real seekers, refreshes itself), the property-type icon set, the matching engine, the Hush Homes browser and its registration gate, the Home Report *pricing* calculator (built from Allied's real fee scale), and the download permission check.

**Facade — looks real, isn't:** all payments; all emails; all uploaded documents; every user account and password; the "vetted" seal (never true, correctly); the sample homes and their photos (AI-generated placeholders); the seeker "agreement signed" dates on sheet-derived profiles. 53 TODO/prototype markers remain in the code.

**Dead ends found:** `/privacy`, `/terms`, `/about`, `/contact`, `/faq`, `/how-it-works` and `/sitemap.xml` all return "not found". No internal link points at them — so no broken links on screen, but also **no legal pages at all**.

---

## 4. The Home Report system — tested end to end

I ran the whole path locally with test data. Verdict: **the ordering half works impressively well; the document half does not work at all.**

### 4.1 Ordering — works, with one manual step by design
Confirmed working: seller enters their own estimate of value → three surveyors quoted from real fee bands (Allied's scale; Graham + Sibbald and Shepherd currently mirror it and are labelled indicative) → correct arithmetic (a £620k home quoted £1,120 = £850 fee + £170 VAT + £100 your fee) → payment step → a **purchase order** is raised (PO-1002 in my test) → three emails composed: surveyor instruction with the PO number, address, owner's name, email and phone and confirmation it's paid; owner "your surveyor will be in touch"; owner receipt.

**How the surveyor is notified: nobody, currently.** The emails are written to an in-memory outbox and never sent. Once email works (§2.6), the surveyor gets an automated email — there is no API integration with Allied, G+S or Shepherd, and none is realistically available; they will reply by phone/email to the seller, which is the normal way this works.

**Statuses:** `none → ordered → uploaded → verified`, with the listing gated at each step, plus a purchase-order track (`instructed → billed → settled`). Admin can see both. **An order can get stuck silently**: if a surveyor never delivers, nothing chases anyone — no reminder, no ageing report, no "overdue" view.

### 4.2 Documents — broken
The upload keeps the **file name only and discards the PDF** (`uploadHomeReport` in `src/lib/actions.ts`). The download route then serves a text file that says "PROTOTYPE PLACEHOLDER". There is no file storage in the project.

**The permission check, though, is correct** — I tested it four ways and it behaved properly every time:

| Who asks | Result |
|---|---|
| Not logged in | **403 refused** |
| Logged in, not a registered seeker | **403 refused** |
| Registered Quiet Seeker | 200 allowed |
| Any request for an unverified report | **404 refused** |

Authorisation is checked **per request**, not hidden in the interface — the right design. What's missing is that real files must not sit on public web addresses: when storage is built it must use private storage with **short-lived signed links** (a link that expires), not public URLs.

### 4.3 The Property Questionnaire — does not exist
Scotland's Home Report is three documents: Single Survey, Energy Report and **Property Questionnaire, which the seller completes**. There is no questionnaire anywhere in the codebase — no form, no saving, no validation. That is a missing feature, not a broken one. **Effort: multiple days** (it's ~20 questions with save-and-return).

### 4.4 What happens when things go wrong
Nothing is handled today: no duplicate-order protection, no replacing a wrongly uploaded file, no way for a seller to retrieve their report a year later, no abandonment handling, no re-issue when a report ages out. Staff have a good admin view of *statuses* but would be running exceptions out of an inbox.

### 4.5 Legal points — for your solicitor, not for me to answer
The duty comes from the **Housing (Scotland) Act 2006, Part 3**. Section 98 requires whoever markets a house to hold the prescribed documents; section 99 requires copies to be given to a prospective buyer on request "within such period as the Scottish Ministers may by regulations specify". The regulations (Prescribed Documents Regulations 2008) set that at **9 days**, and industry guidance consistently states a Home Report must be **no more than 12 weeks old when the property goes on the market**. *I'd treat the 9-day and 12-week figures as reliable but worth your solicitor confirming against the current regulations — I'm citing secondary sources for the specific numbers.*

**The system cannot currently honour either rule:** nothing records a report's age, nothing warns when it approaches 12 weeks, and there is no mechanism to log or chase a buyer's request against a 9-day clock.

**The question to put to your solicitor** (I am deliberately not answering it): the Act defines a house as on the market when "the fact that it is or may become available for sale is… made public in Scotland" (s.119). Whether showing a property privately to registered Quiet Seekers counts as "made public" is genuinely unclear, and it decides whether a Hush Home seller needs a Home Report *at all* at Stage 1. Your whole "list free, report later" proposition depends on the answer.

---

## 5. Should fix before launch

1. **Upgrade dependencies** to clear the 3 high-severity advisories. Me · 2 hours · after a staging environment exists so it can be tested.
2. **Push the code to GitHub** with automatic deploys. Right now the only copy of the codebase is on one laptop and deploys happen by hand. Me · half a day.
3. **A staging environment** — a private copy to test on before customers see it. Me · half a day · needs 2.1.
4. **Rate limiting** on anything that emails, creates records or costs money — there is none, so a bot could flood your surveyor instructions. Me · half a day.
5. **Validate the Home Report upload** (type and size). Photo uploads are validated; the PDF upload is not. Me · 1 hour.
6. **Error tracking and uptime monitoring** (e.g. Sentry + a pinger) — today you'd learn about an outage from a customer. Me to wire, You to approve the accounts · half a day.
7. **The "matched" and admin housekeeping gaps** — see §9. Me · 1–2 days.
8. **SEO basics**: no sitemap, no social-sharing images, no page-description tags, and **`robots.txt` currently tells Google to index nothing** — correct for a preview, disastrous if it ships to production. Me · half a day.
9. **Analytics** — none installed, so you'd have no idea how many people visit. Me · 2 hours · your choice of provider (Vercel Analytics or Plausible, both privacy-friendly).
10. **Accessibility and performance pass** at WCAG AA. Spot checks were good (keyboard operation, live-region announcements, 44px touch targets) but no full audit has been done. Me · a day.

---

## 6. Payments — full specification (nothing built yet)

**Recommendation: Stripe Checkout (hosted).** I agree with your default and see no reason to argue. Card details never touch your servers, which keeps you at the lowest PCI compliance tier (a short self-assessment questionnaire rather than an audit), and a coding mistake cannot leak a card number.

### 6.1 What you need to open — start this now, it has a lead time
Stripe account with: business details (Mowatt Move Smarter Ltd, company number, registered address), the business bank account, and identity verification for directors (passport/driving licence). **Verification typically takes anywhere from minutes to several working days**, occasionally longer if they request extra documents — start it early so it can't ambush launch day. *(Who: You · Effort: an hour of form-filling, then waiting.)*

**Keys:** Stripe gives test keys (`sk_test_…`) and live keys (`sk_live_…`). Test keys go in local development and staging; live keys go **only** in Vercel's production environment variables, never in the code. Protection: keys stay out of git entirely (already the case), the live secret key is set only on production in Vercel's dashboard, and I'll add a startup check that refuses to run if a test key is found in production or vice versa.

### 6.2 The flow
1. Seller picks a surveyor and confirms the quote on Matchlisted.
2. **We create the order in our database first, marked "awaiting payment"** — so a payment can never arrive with nothing attached to it.
3. They're redirected to Stripe's own page (works properly on mobile, supports Apple Pay/Google Pay).
4. They pay and are returned to a "thanks, we're arranging your surveyor" page.
5. **Fulfilment happens on the webhook, not on that page** (see below).

### 6.3 Webhooks — why this is non-negotiable
A webhook is Stripe telephoning your server to say "this payment definitely succeeded". Fulfilment must never be triggered by the customer landing back on your success page, because they can close the browser, lose signal on a train, or simply type the success URL into their address bar and get a free Home Report.

- **Events handled:** `checkout.session.completed` (fulfil), `checkout.session.expired` (abandoned), `charge.refunded`, `charge.dispute.created`.
- **Signature verification:** every webhook is signed by Stripe; we verify the signature with a separate signing secret and reject anything unsigned. Without this, anyone could forge a "payment succeeded" message.
- **Idempotent handling:** Stripe retries. We record each event ID and ignore duplicates, so a retry can never instruct two surveys or raise two purchase orders.
- **If our endpoint is down:** Stripe retries automatically for up to ~3 days with backoff, so a brief outage self-heals. Failures beyond that need an alert so you know to intervene.

### 6.4 The unhappy paths
| What happens | Customer sees | Mowatt sees |
|---|---|---|
| Card declined | Stripe's own message, can retry | Order stays "awaiting payment" |
| Abandons at Stripe | Nothing; back where they started | Order visible as abandoned; optional reminder email |
| Paid, webhook fails | Payment taken, thank-you page | **Alert** — reconcile manually; money is safe |
| Double submission | Second attempt blocked | One order, one PO (idempotency) |
| Refund | Refund email from Stripe; funds back in 5–10 days | Refund logged; PO must be cancelled with the surveyor |
| Chargeback | Bank dispute | Stripe alert + **£20 fee**; evidence to upload within a deadline |

### 6.5 Refunds
Issued from the Stripe dashboard in two clicks — **no developer needed**. What *does* need a person is cancelling the surveyor instruction, since you may already owe them. Pair this with the cancellation policy (§2.8).

### 6.6 Money in, money out
- Receipts: Stripe can email receipts automatically; your own confirmation email should carry the PO number.
- Admin view of payments: Stripe's dashboard covers it initially; a simple in-site view is a nice-to-have.
- **Xero:** Stripe has an official Xero integration that imports payments and fees, and Xero also offers "Pay with Stripe" on invoices. My honest position: it usually covers a business like yours, but **confirm the exact fit with your accountant** — I'm not certain how you want the £100 margin and the surveyor's cost recorded, and that's an accounting decision, not a technical one.
- **Real margin on a Home Report:** Stripe UK charges **1.5% + 20p** for UK consumer cards (higher for international/business cards). On the £1,120 example that's ~£17. So of £1,120 in: ~£1,020 to the surveyor (their fee + VAT), ~£17 to Stripe, leaving **roughly £83 of your £100 fee** — before your own VAT treatment.

### 6.7 VAT — for you and your accountant, not for me
Decisions needed before I write a line of payment code: whether Home Report arrangement is standard-rated; whether you're over the £90,000 registration threshold; whether the surveyor's fee passes through as a disbursement or is part of your supply (this materially changes the numbers above); whether displayed prices are VAT-inclusive; and whether Stripe Tax is worth it. **I will not hardcode a VAT rate until you tell me the answer** — the current 20% in the quote calculator is a placeholder inherited from the prototype.

### 6.8 Testing before real money moves
Stripe test cards (including specific numbers that force declines and 3-D Secure challenges), the Stripe CLI to replay webhooks against my local machine, and a scripted rehearsal of all six unhappy paths. Then, exactly as you asked: **a real £1 payment on live keys, refunded by you from the dashboard**, before we open the doors.

---

## 7. Security, data protection and compliance

### 7.1 Security summary
Good: no secrets in the code or its history; sensible security headers already configured; the Home Report permission check is properly enforced per request; photo uploads are size- and type-validated; every data-changing action except sign-in/registration checks who you are.

Bad: **no passwords at all** (§2.2); **public developer back doors** (§2.4); **no rate limiting anywhere**; unvalidated PDF upload; 3 high-severity dependency advisories. How would someone get into the admin area? They'd click the "Phil — admin" button on the login page. That is the whole attack.

### 7.2 Personal data — what you need in place
You hold real data now: 142 seeker profiles (from your Google Sheets), plus any registrations. Note the sheets are **published to the public web** by design — worth confirming with your solicitor that this is what you intend, since it's a Mowatt decision that Matchlisted inherits.

Needed before launch: privacy policy; cookie banner with genuine consent; ICO registration (~£52/yr); data-processing agreements with Stripe, Supabase, Vercel and your email provider; a documented process for someone requesting their data or asking to be deleted (currently there is no way to delete a person); and a retention policy — how long you keep Home Reports and seeker profiles. **Who: You** (wording/solicitor) with me implementing.

Data leaving to the browser: I checked the actual page source — **no names, emails or phone numbers reach the public pages**, and the Hush Homes gate genuinely withholds restricted fields server-side rather than hiding them with styling. That part is done right.

### 7.3 Estate agency compliance — checklist for your adviser, no advice from me
Take this list to your adviser and ask which apply to Matchlisted as opposed to Mowatt:
- **Redress scheme** membership (The Property Ombudsman or PRS) — normally mandatory for estate agency work, must be displayed.
- **Anti-money-laundering supervision** (HMRC registration for estate agency businesses) plus customer due diligence on sellers and buyers.
- **Client money protection** — if you ever hold client money (you don't appear to today; the surveyor is paid by you, from your own account).
- **Material information** on listings (Trading Standards/NTSELAT guidance — tenure, council tax band, price transparency).
- **Company details on the website** — registered name, company number, registered office, VAT number if registered.
- **Estate Agents Act 1979** disclosure obligations.

**What the site shows today:** the footer carries some company details; there is **no redress scheme logo, no AML statement, no complaints procedure, and no terms**. Whether that's a gap is your adviser's call, not mine.

---

## 8. The rest

### 8.1 Domain and hosting
You own **matchlisted.com** (currently redirecting to mowatt.uk). Needed: point it at Vercel, make both `matchlisted.com` and `www.` resolve with one redirecting to the other, SSL (automatic), and decide what happens to the existing redirect. Preview deployments are public — Vercel's password protection is a **paid plan feature**, so that's a purchase decision for you.

### 8.2 Does it actually work?
I walked the real journeys on desktop and at 360px, 768px and 1280px. **The browsing experience works well**: homepage, Quiet Seekers with filters, Hush Homes with the registration gate, seeker profiles, the introduction flow, the Home Report ordering path. No broken internal links, no layout breakage, no console errors.

What's broken or absent, restated: uploaded documents, real emails, real payments, real accounts, and the six missing content pages.

### 8.3 Speed and quality
Fast — built and served by Vercel with images optimised. Error and empty states are handled thoughtfully in the parts that are built. No formal Core Web Vitals or accessibility audit has been run (§5.10).

### 8.4 Email deliverability
Once sending is real, the domain needs **SPF, DKIM and DMARC** records (three DNS entries that prove your emails are genuinely yours). I found a DMARC entry on matchlisted.com but could not confirm its contents or whether SPF/DKIM exist for a sending provider — this needs doing properly with whichever provider you choose, or receipts will land in spam.

### 8.5 Monitoring
Nothing exists. At 9pm on a Sunday you would find out from a customer. §5.6 fixes this.

---

## 9. Running it day to day — what staff can and can't do

**Can, without a developer:** verify a Home Report and put a listing live; offer an introduction to a seeker and see the gate checklist; move a purchase order through billed → settled; read the email outbox; adjust the matching weights; add or edit a Quiet Seeker (via the Google Sheets — which is genuinely good, your team already owns that).

**Cannot, without a developer:** create or delete a user; reset anyone's password; edit or remove a Hush Home they don't own; fix a typo on any page (all copy is in the code); refund a payment *in the site* (Stripe's dashboard covers it); export anything; delete a person's data on request; mark a seeker matched from Matchlisted (that's a sheet edit).

**Honest assessment:** the admin is better than most prototypes, but "fix a typo" and "delete a person's data" are the two gaps that will land on you forever. A small content-editing capability is worth considering after launch.

---

## 10. Tests and safety net

There are **no automated tests of any kind**, no continuous integration, and no staging environment. Deployment is a manual command from one laptop. Rolling back is possible in Vercel's dashboard (one click, ~1 minute) — that part is fine. Before launch I'd want, at minimum, automated tests around payments, the Home Report permission rules, and the go-live gate: the three places where a silent breakage costs money or leaks data. *Effort: 2–3 days.*

---

## 11. The five things to do first, in order

1. **Open the Stripe account and start verification** (You, 1 hour + waiting). First because it's the only item with an external clock — everything else waits on people, this waits on Stripe.
2. **Ask your solicitor the "on the market" question** (You). It decides whether Hush Home sellers need a Home Report at Stage 1 at all — which could change what we build. Cheap to ask, expensive to get wrong after building.
3. **Delete the public developer back doors** (Me, under an hour). The only genuinely dangerous thing that can be fixed today, and it needs nothing else.
4. **Database + real logins + file storage** (Me, ~2 weeks). One connected piece of work; the foundation everything else stands on. Nothing else is worth building first.
5. **Payments end to end, then the £1 live rehearsal** (Me + You, ~1 week). Last of the five because it needs both the database and your verified Stripe account.

---

## 12. Honest estimate

**8 to 13 weeks of working time to a responsible launch.**

That assumes: one developer working steadily rather than full-time-flat-out; your solicitor, accountant and Stripe verification running in parallel rather than sequentially; the Property Questionnaire being built (drop it and you save 3–5 days, if the legal answer allows); and no significant change of direction.

The range is wide for one honest reason: **payments and Home Report document storage both need real, careful work**, and both have a long tail of unglamorous edge cases — refunds, chargebacks, failed webhooks, expiring links, retention — that are exactly where a rushed launch hurts a business handling other people's money and other people's homes. The lower end assumes the legal answers come back simple and no surprises in the data migration; the upper end assumes the "on the market" question forces a rethink of the Stage 1 flow.

What you should **not** hear in that number: the site is in bad shape. It isn't. It's a good prototype that has never had to be a real business. The work ahead is mostly foundations, not repairs.

---

### Sources
- [Housing (Scotland) Act 2006, Part 3 — legislation.gov.uk](https://www.legislation.gov.uk/asp/2006/1/part/3)
- [The Housing (Scotland) Act 2006 (Prescribed Documents) Regulations 2008](https://www.legislation.gov.uk/ssi/2008/76/contents/made)
- [Home Reports — gov.scot](https://www.gov.scot/policies/homeowners/home-reports/)
- [Do you need a Home Report before marketing starts? — ESPC](https://espc.com/news/post/do-you-need-a-home-report)
- [How long does a Home Report last? — Allied Surveyors Scotland](https://www.alliedsurveyorsscotland.com/news-insights-article/2023/02/23/how-long-does-a-home-report-last/)
