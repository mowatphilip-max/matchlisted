import Link from "next/link";
import {
  Heart,
  FileCheck2,
  CalendarCheck,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { Scribble } from "@/components/scribble";
import { MatchRing } from "@/components/match-ring";
import { HomeCard } from "@/components/home-card";
import { MowattSeekerCard } from "@/components/seekers/mowatt-seeker-card";
import { ConceptReel } from "@/components/home/concept-reel";
import { AreaFinder } from "@/components/home/area-finder";
import { LiveTicker } from "@/components/home/live-ticker";
import { getBrief, homesBySeller, liveHomes } from "@/lib/db";
import { matchesForHome, matchesForSeeker } from "@/lib/matches";
import { mowattAreaStats } from "@/lib/mowatt-bridge";
import { fetchMowattSeekers } from "@/lib/mowatt-seekers";
import { areaSeekerStats, matchlistPulse } from "@/lib/pulse";
import { currentUser } from "@/lib/session";
import { areaShortLabel } from "@/lib/areas";
import { matchLine } from "@/lib/match";
import { formatPrice } from "@/lib/format";
import { CONFIG, HOME_REPORT_MARGIN } from "@/lib/site";

/** The personalized hero copy for a signed-in visitor, or null. */
async function personalHero(userId: string, name: string) {
  const first = name.split(" ")[0];
  const brief = await getBrief(userId);

  // Seeker side first: the "your match is waiting" moment is the strongest.
  // Read-only queries ONLY — collectFreshHotMatches() belongs to /dashboard.
  if (brief?.contract) {
    const top = (await matchesForSeeker(userId))[0];
    if (top && top.result.pct >= 50) {
      return {
        headline: `${first}, a ${top.result.pct}% match is waiting.`,
        sub: `${top.home.headline} in ${areaShortLabel(top.home.areaId)} · ${matchLine(top.result.pct)}`,
        pct: top.result.pct,
        cta: { href: `/homes/${top.home.id}`, label: "Meet the home" },
        cta2: { href: "/matches", label: "All my matches" },
      };
    }
  }

  const live = (await homesBySeller(userId)).filter(
    (h) => h.status === "live" || h.status === "under-offer",
  );
  if (live.length > 0) {
    const top = (await matchesForHome(live[0]))[0];
    if (top && top.result.pct >= 50) {
      return {
        headline: `${first}, a Quiet Seeker is a ${top.result.pct}% match with your home.`,
        sub: `A ${top.positionLabel.toLowerCase()} with a ${formatPrice(top.budgetMax)} ceiling has your Hush Home high on their list.`,
        pct: top.result.pct,
        cta: { href: "/dashboard", label: "See who's matching" },
        cta2: null,
      };
    }
  }

  return {
    headline: `Welcome back, ${first}.`,
    sub: "Your profile is half-built. Finish it and the Matchlist starts scoring every pairing on your behalf.",
    pct: null,
    cta: { href: "/dashboard", label: "Pick up where you left off" },
    cta2: null,
  };
}

export default async function HomePage() {
  const user = await currentUser();
  const hero = user ? await personalHero(user.id, user.name) : null;
  const pulse = await matchlistPulse();

  // Quiet Seeker numbers come live from the shared Mowatt sheets.
  const { seekers } = await fetchMowattSeekers();
  const liveSeekers = seekers.filter((s) => s.active);
  const stats =
    liveSeekers.length > 0 ? mowattAreaStats(seekers) : await areaSeekerStats();
  const seekerTeasers = liveSeekers.slice(0, 3);
  const seekerCount = liveSeekers.length;

  const teasers = (await liveHomes())
    .filter((h) => h.status === "live")
    .slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="hero-ground relative overflow-hidden">
        {/* The house-heart, watermark-sized — the brand literally behind everything */}
        <LogoMark
          className="pointer-events-none absolute -right-24 -top-16 h-[26rem] w-auto -rotate-6 text-charcoal opacity-[0.06] select-none sm:h-[34rem] lg:-right-16 lg:-top-24"
        />
        <Container className="relative grid grid-cols-1 items-center gap-14 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="fade-up">
            {hero ? (
              <>
                <p className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-orange-deep">
                  <Heart className="h-5 w-5 fill-current" />
                  The Matchlist has news for you
                </p>
                <h1 className="display-xl mt-7">{hero.headline}</h1>
                <div className="mt-6 flex items-center gap-4">
                  {hero.pct !== null && (
                    <MatchRing pct={hero.pct} size="lg" animate countUp />
                  )}
                  <p className="max-w-xl text-lg leading-relaxed text-charcoal-soft">
                    {hero.sub}
                  </p>
                </div>
                <div className="mt-9 flex flex-wrap gap-3">
                  <ButtonLink href={hero.cta.href} className="px-7 text-base">
                    {hero.cta.label}
                  </ButtonLink>
                  {hero.cta2 && (
                    <ButtonLink
                      href={hero.cta2.href}
                      variant="seeker"
                      className="px-7 text-base"
                    >
                      {hero.cta2.label}
                    </ButtonLink>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-orange-deep">
                  <Heart className="h-5 w-5 fill-current" />
                  The dating site for homes
                </p>
                <h1 className="display-xl mt-7">
                  Where Quiet Seekers meet{" "}
                  <Scribble>Hush Homes</Scribble>.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal-soft">
                  Every home gets a listing. Every buyer gets a profile. The
                  Matchlist scores every pairing across all of Scotland, and
                  when the numbers spark, we make the Introduction.
                </p>
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-blue-text">
                  No boards. No portals. Just Introductions.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <ButtonLink href="/join" className="px-7 text-base">
                    Find your match
                  </ButtonLink>
                  <ButtonLink href="/join?as=seller" variant="seller" className="px-7 text-base">
                    List your home
                  </ButtonLink>
                </div>
                <AreaFinder stats={stats} />
              </>
            )}
            <LiveTicker events={pulse} className="mt-6" />
            {!hero && (
              <p className="mt-5 text-xs font-medium text-charcoal-soft">
                Home Reports by Allied Surveyors &amp; Graham + Sibbald · signed
                agreements on both sides · every corner of Scotland
              </p>
            )}
          </div>

          {/* The Concept Reel — a looping in-code "video" of the whole idea */}
          <div className="fade-up-late">
            <ConceptReel />
            <p className="mt-4 text-center text-xs text-charcoal-soft">
              A real pairing from the Matchlist, anonymised.
            </p>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
        <Container>
          <h2 className="display-lg">
            How the <Scribble>matching</Scribble> works
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-charcoal-soft">
            Like any good matchmaker, we only introduce people who are
            serious: sellers with a verified Home Report, buyers with a signed
            Quiet Seeker Profile.
          </p>
          <div className="stagger-in mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Heart,
                n: "01",
                title: "Make a profile",
                body: "Sellers build their Hush Home Listing, free. Buyers register as Quiet Seekers with a structured Quiet Seeker Profile: areas anywhere in Scotland, budget range, beds, garden, the lot.",
              },
              {
                icon: Sparkles,
                n: "02",
                title: "The Matchlist scores every pairing",
                body: "Every Hush Home is rated against every Quiet Seeker Profile as a Match %. Location weighs heaviest, then price, bedrooms, type and the rest. At 90%+, both sides get the “It's a match” moment.",
              },
              {
                icon: CalendarCheck,
                n: "03",
                title: "Introductions, not adverts",
                body: "Registered Quiet Seekers download the Home Report, book a viewing from the seller's own diary, and make their offer with a lawyer already appointed. Missives conclude; everyone moves.",
              },
            ].map(({ icon: Icon, n, title, body }) => (
              <div
                key={title}
                className="card-lift relative overflow-hidden rounded-[var(--radius-lg)] bg-paper p-6 pt-7 shadow-[var(--shadow-card)] ring-1 ring-hairline"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 -top-5 font-display text-[5.5rem] font-extrabold leading-none tracking-tighter text-soft select-none"
                >
                  {n}
                </span>
                <span className="relative inline-flex rounded-2xl bg-orange-tint p-3 text-orange-deep">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-4 text-lg">{title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-charcoal-soft">
                  {body}
                </p>
              </div>
            ))}
          </div>

          {/* Ring bands */}
          <div className="mt-12 flex flex-wrap items-center gap-8 rounded-[var(--radius-lg)] bg-soft p-6">
            <div className="flex items-center gap-3">
              <MatchRing pct={94} size="sm" />
              <p className="text-sm">
                <strong>90%+</strong>
                <span className="block text-charcoal-soft">
                  It&apos;s a match, both sides told
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MatchRing pct={72} size="sm" />
              <p className="text-sm">
                <strong>50–89%</strong>
                <span className="block text-charcoal-soft">
                  Worth a look, on your matches list
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MatchRing pct={31} size="sm" />
              <p className="text-sm">
                <strong>Under 50%</strong>
                <span className="block text-charcoal-soft">
                  Probably not the one
                </span>
              </p>
            </div>
            <p className="ml-auto max-w-xs text-xs text-charcoal-soft">
              Location weighs heaviest (35%), then price vs budget (25%),
              bedrooms, property type, bathrooms, garden and your extras.
            </p>
          </div>
        </Container>
      </section>

      {/* Teaser homes — hidden entirely until there are live homes to show */}
      {teasers.length > 0 && (
      <section className="bg-soft py-20 sm:py-28">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="display-lg">Hush Homes, quietly waiting</h2>
              <p className="mt-4 max-w-xl text-lg text-charcoal-soft">
                A few of the homes currently on the Matchlist. Sign in as a
                Quiet Seeker to see your own Match % on every one.
              </p>
            </div>
            <ButtonLink href="/join" variant="seeker">
              See your matches
            </ButtonLink>
          </div>
          <div className="stagger-in mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teasers.map((home) => (
              <HomeCard key={home.id} home={home} href="/join" />
            ))}
          </div>
        </Container>
      </section>
      )}

      {/* Teaser seekers — the buyer side of the Matchlist, equally visible */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="display-lg">
                {seekerCount} Quiet Seekers, quietly looking
              </h2>
              <p className="mt-4 max-w-xl text-lg text-charcoal-soft">
                Real, verified buyers with signed agreements: anonymised, but
                genuinely in the market. Think one of them is looking for{" "}
                <em>your</em> home? Click their profile and raise your hand.
              </p>
            </div>
            <ButtonLink href="/seekers" variant="seeker">
              Meet the Seekers
            </ButtonLink>
          </div>
          <div className="stagger-in mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {seekerTeasers.map((seeker) => (
              <MowattSeekerCard key={seeker.ref} seeker={seeker} />
            ))}
          </div>
        </Container>
      </section>

      {/* Trust: Home Report + contracts */}
      <section className="py-20 sm:py-28">
        <Container className="grid items-start gap-10 lg:grid-cols-2">
          <div className="lg:sticky lg:top-28">
            <h2 className="display-lg">
              Playful about matches.
              <br />
              Serious about money.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-charcoal-soft">
              Every Hush Home must have a completed Home Report from Allied
              Surveyors or Graham + Sibbald before it goes live, so every
              Match % sits on a professionally verified value. Every Quiet
              Seeker signs their agreement before they can view, download or
              offer. Both sides know the other is real.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              {
                icon: FileCheck2,
                title: "Home Report verified before going live",
                body: "Ordered through Matchlisted from our trusted surveyors; downloadable only by registered Quiet Seekers.",
              },
              {
                icon: Scale,
                title: "Offer freely, appoint a solicitor after",
                body: "Make a Note of Offer with no solicitor and nothing to pay. Once it's accepted, use your own solicitor or one from our panel.",
              },
              {
                icon: ShieldCheck,
                title: "Contracts signed on both sides",
                body: "Sellers commit to selling through the platform; seekers commit to the fixed £360 buyer fee (including VAT) when they complete. Everyone plays fair.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="card-lift flex gap-4 rounded-[var(--radius-lg)] bg-paper p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline"
              >
                <span className="inline-flex h-fit rounded-xl bg-green-tint p-2.5 text-green-deep">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base">{title}</h3>
                  <p className="mt-1 text-sm text-charcoal-soft">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Fees */}
      <section id="fees" className="scroll-mt-20 bg-soft py-20 sm:py-28">
        <Container>
          <h2 className="display-lg">Fees, in plain sight</h2>
          <p className="mt-4 max-w-2xl text-lg text-charcoal-soft">
            All prices include VAT. No listing fees, no percentage for
            sellers, no surprises later.
          </p>
          <div className="mt-10 overflow-x-auto rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wider text-charcoal-soft">
                  <th className="px-6 py-4 font-semibold">Fee</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline [&>tr]:transition-colors [&>tr:hover]:bg-soft/60">
                <tr>
                  <td className="px-6 py-4 font-medium">Hush Home listing</td>
                  <td className="px-6 py-4 font-display font-bold text-green-deep">
                    {CONFIG.copy.listingHeadline}
                  </td>
                  <td className="px-6 py-4 text-charcoal-soft">
                    {CONFIG.copy.listingSubline}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Home Report (our margin)</td>
                  <td className="px-6 py-4 font-display font-bold">£{HOME_REPORT_MARGIN}</td>
                  <td className="px-6 py-4 text-charcoal-soft">Before the listing goes live</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Seller withdrawal fee</td>
                  <td className="px-6 py-4 font-display font-bold text-green-deep">None</td>
                  <td className="px-6 py-4 text-charcoal-soft">Withdraw whenever you need. You only ever pay for your Home Report</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Quiet Seeker registration</td>
                  <td className="px-6 py-4 font-display font-bold text-green-deep">Free</td>
                  <td className="px-6 py-4 text-charcoal-soft">Always</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Buyer fee</td>
                  <td className="px-6 py-4 font-display font-bold text-orange-deep">£{CONFIG.fees.buyerFeeGross} fixed</td>
                  <td className="px-6 py-4 text-charcoal-soft">On conclusion of missives, whatever the price</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-charcoal-soft">
            Worked example: buy a {formatPrice(300000)} home found on
            Matchlisted and the buyer fee is{" "}
            <strong className="text-charcoal">
              {formatPrice(CONFIG.fees.buyerFeeGross)} including VAT
            </strong>
            , the same on every home at every price. It stays payable if you
            buy the same home later, even after it has left the site.
          </p>
        </Container>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-charcoal-deep py-20 text-white sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(42rem 22rem at 50% 120%, rgb(232 105 58 / 0.22), transparent 65%)",
          }}
        />
        <Container className="relative text-center">
          <LogoMark draw="view" className="mx-auto h-24 w-auto text-white sm:h-28" />
          <h2 className="display-lg mx-auto mt-6 max-w-3xl text-white">
            Your home&apos;s <Scribble>perfect match</Scribble> is already
            looking.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
            List quietly, match precisely, move smarter. It costs nothing to
            see who&apos;s out there.
          </p>
          <div className="mt-7 flex justify-center">
            <LiveTicker events={pulse} />
          </div>
          <p className="mt-3 text-sm font-semibold text-white/80">
            Join them. It&apos;s free.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/join?as=seller">List your Hush Home</ButtonLink>
            <ButtonLink href="/join" variant="onDark">
              Become a Quiet Seeker
            </ButtonLink>
          </div>
          <p className="mt-6 text-xs text-white/70">
            Already matched?{" "}
            <Link href="/login" className="underline hover:text-white">
              Sign in
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
