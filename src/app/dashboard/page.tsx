import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  Heart,
  Home,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { HomeCard } from "@/components/home-card";
import { HeartButton } from "@/components/heart-button";
import { SeekerMatchCard } from "@/components/seeker-match-card";
import { MatchRing } from "@/components/match-ring";
import { currentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { respondToIntroduction } from "@/lib/actions";
import {
  getBrief,
  getHome,
  homesBySeller,
  introductionsBySeller,
  introductionsForSeeker,
  invoicesForUser,
  offersForSeeker,
  savedForSeeker,
  viewingsForSeeker,
} from "@/lib/db";
import {
  collectFreshHotMatches,
  matchesForHome,
  matchesForSeeker,
} from "@/lib/matches";
import { areaLabel, areaShortLabel } from "@/lib/areas";
import { formatBudget, formatDateTime, formatMoney, formatPrice } from "@/lib/format";
import { matchLine } from "@/lib/match";
import { BUYING_POSITIONS, PROPERTY_TYPES } from "@/lib/types";

export const metadata: Metadata = { title: "Your dashboard" };

const statusLabels: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft — not yet live", cls: "bg-soft text-charcoal-soft" },
  "pending-approval": {
    label: "Home Report under review",
    cls: "bg-blue-tint text-blue-deep",
  },
  live: { label: "Live on the Matchlist", cls: "bg-green-tint text-green-deep" },
  "under-offer": { label: "Under offer", cls: "bg-orange-tint text-orange-deep" },
  sold: { label: "Sold", cls: "bg-charcoal text-white" },
  withdrawn: { label: "Withdrawn", cls: "bg-red-tint text-red-deep" },
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const brief = getBrief(user.id);
  const myHomes = homesBySeller(user.id);
  const fresh = collectFreshHotMatches(user.id);

  const seekerMatches = brief?.contract ? matchesForSeeker(user.id) : [];
  const topSeekerMatches = seekerMatches.slice(0, 6);
  const saved = new Set(savedForSeeker(user.id).map((s) => s.homeId));

  const sellerMatchesByHome = myHomes
    .filter((h) => h.status === "live" || h.status === "under-offer")
    .map((home) => ({ home, matches: matchesForHome(home).slice(0, 3) }));

  const viewings = viewingsForSeeker(user.id);
  const pendingFeedback = viewings.filter(
    (v) => v.status === "booked" && new Date(v.end) < new Date(),
  );
  const upcoming = viewings.filter(
    (v) => v.status === "booked" && new Date(v.end) >= new Date(),
  );
  const offers = offersForSeeker(user.id);
  const dueInvoices = invoicesForUser(user.id).filter((i) => i.status === "due");

  // Introductions: offers waiting on me as a seeker, and the status of any
  // "they might want my home" clicks I've made as an owner.
  const introOffers = introductionsForSeeker(user.id).filter(
    (i) => i.status === "offered",
  );
  const outgoingIntros = introductionsBySeller(user.id);

  const firstName = user.name.split(" ")[0];

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Hello, {firstName}</h1>
          <p className="mt-1 text-charcoal-soft">
            The Matchlist has been busy on your behalf.
          </p>
        </div>
        {brief?.contract && (
          <ButtonLink href="/matches" variant="seeker">
            All my matches <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        )}
      </div>

      {/* It's a match — fresh ≥90% pairings */}
      {(fresh.asSeeker.length > 0 || fresh.asSeller.length > 0) && (
        <div className="mt-8 rounded-[var(--radius-xl)] bg-orange-tint p-6 ring-1 ring-orange/30">
          <p className="flex items-center gap-2 font-display text-2xl font-bold text-orange-deep">
            <Sparkles className="h-6 w-6" /> It&apos;s a match!
          </p>
          <ul className="mt-3 space-y-2">
            {fresh.asSeeker.map((m) => (
              <li key={m.home.id} className="flex flex-wrap items-center gap-3">
                <MatchRing pct={m.result.pct} size="sm" animate />
                <span className="text-sm">
                  <strong>{m.home.headline}</strong> in{" "}
                  {areaShortLabel(m.home.areaId)} — {matchLine(m.result.pct)}
                </span>
                <Link
                  href={`/homes/${m.home.id}`}
                  className="text-sm font-semibold text-orange-deep underline"
                >
                  Meet the home
                </Link>
              </li>
            ))}
            {fresh.asSeller.map(({ home, match }) => (
              <li
                key={`${home.id}-${match.seekerId}`}
                className="flex flex-wrap items-center gap-3"
              >
                <MatchRing pct={match.result.pct} size="sm" animate />
                <span className="text-sm">
                  A Quiet Seeker ({match.positionLabel.toLowerCase()}) is a{" "}
                  <strong>{match.result.pct}% match</strong> with{" "}
                  <strong>{home.headline}</strong>.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Introduction offers — a Hush Home owner clicked my public profile */}
      {introOffers.map((intro) => {
        const home = intro.homeId ? getHome(intro.homeId) : undefined;
        if (!home) return null;
        return (
          <div
            key={intro.id}
            className="mt-8 rounded-[var(--radius-xl)] bg-blue-tint p-6 ring-1 ring-blue-deep/20"
          >
            <p className="flex items-center gap-2 font-display text-xl font-bold text-blue-deep">
              <Heart className="h-5 w-5 fill-blue-deep" /> A home owner spotted
              your profile
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal">
              The owner of a{" "}
              <strong>
                {home.beds}-bed {PROPERTY_TYPES.find((t) => t.value === home.type)?.label.toLowerCase() ?? home.type}
              </strong>{" "}
              in <strong>{areaShortLabel(home.areaId)}</strong> at{" "}
              <strong>{formatPrice(home.price)}</strong> saw your Quiet Seeker
              profile and thinks their home could be the one. Want to see it?
              Entirely your choice — say no and neither of you is ever named.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <form action={respondToIntroduction}>
                <input type="hidden" name="introId" value={intro.id} />
                <input type="hidden" name="answer" value="yes" />
                <Button type="submit">Yes — show me the home</Button>
              </form>
              <form action={respondToIntroduction}>
                <input type="hidden" name="introId" value={intro.id} />
                <input type="hidden" name="answer" value="no" />
                <Button type="submit" variant="secondary">
                  No thanks
                </Button>
              </form>
            </div>
          </div>
        );
      })}

      {/* Action needed */}
      {(pendingFeedback.length > 0 || dueInvoices.length > 0) && (
        <div className="mt-8 space-y-3">
          {pendingFeedback.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-tint p-4"
            >
              <p className="text-sm">
                <strong>How was your viewing?</strong> Tell the seller what you
                thought — and whether you&apos;re still interested.
              </p>
              <ButtonLink
                href={`/viewings/${v.id}/feedback`}
                variant="seeker"
                className="min-h-9 px-4 py-1.5"
              >
                Leave feedback
              </ButtonLink>
            </div>
          ))}
          {dueInvoices.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft p-4"
            >
              <p className="flex items-center gap-2 text-sm">
                <Receipt className="h-4 w-4 text-charcoal-soft" />
                <span>
                  <strong>{formatMoney(inv.net + inv.vat)}</strong> due —{" "}
                  {inv.description}
                </span>
              </p>
              {inv.kind === "home-report" || inv.kind === "conveyancing-deposit" ? (
                <ButtonLink href={`/pay/${inv.id}`} className="min-h-9 px-4 py-1.5">
                  Pay now
                </ButtonLink>
              ) : (
                <span className="text-xs text-charcoal-soft">
                  Invoiced — payable by bank transfer
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Your top matches */}
      <section className="mt-10">
        <h2 className="text-2xl">Your top matches</h2>
        {brief?.contract ? (
          topSeekerMatches.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topSeekerMatches.map((m) => (
                <HomeCard
                  key={m.home.id}
                  home={m.home}
                  pct={m.result.pct}
                  matchDetail={m.result.gated ?? m.result.components[0].detail}
                  href={`/homes/${m.home.id}`}
                  heartSlot={
                    <HeartButton homeId={m.home.id} saved={saved.has(m.home.id)} />
                  }
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-soft p-6 text-sm text-charcoal-soft">
              No live Hush Homes match your brief yet. The moment one lists,
              you&apos;ll be the first to know.
            </p>
          )
        ) : (
          <div className="mt-4 rounded-2xl bg-soft p-6">
            <p className="text-sm text-charcoal-soft">
              {brief
                ? "Your brief is saved but unsigned — sign the Quiet Seeker agreement to activate matching."
                : "Build your Quiet Seeker brief and the Matchlist will rate every Hush Home in Scotland against it."}
            </p>
            <ButtonLink
              href={brief ? "/dashboard/brief/contract" : "/dashboard/brief"}
              className="mt-4"
            >
              {brief ? "Sign & activate" : "Build my brief"}
            </ButtonLink>
          </div>
        )}
      </section>

      {/* Seller-side matches per home */}
      {sellerMatchesByHome.map(({ home, matches }) => (
        <section key={home.id} className="mt-10">
          <h2 className="text-2xl">
            Seekers matching {areaShortLabel(home.areaId)}
          </h2>
          <p className="mt-1 text-sm text-charcoal-soft">
            Anonymised until they book a viewing of {home.headline}.
          </p>
          {matches.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((m) => (
                <SeekerMatchCard key={m.seekerId} match={m} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-soft p-6 text-sm text-charcoal-soft">
              No registered Quiet Seekers match this home yet.
            </p>
          )}
        </section>
      ))}

      {/* The two profile halves */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* My Hush Home */}
        <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl">
              <Home className="h-5 w-5 text-orange-deep" /> My Hush Home
            </h2>
            {myHomes.length > 0 && (
              <Link
                href="/dashboard/home/new"
                className="text-sm font-semibold text-orange-deep hover:underline"
              >
                + Another
              </Link>
            )}
          </div>
          {myHomes.length === 0 ? (
            <div className="mt-4">
              <p className="text-sm text-charcoal-soft">
                Nothing listed yet. Listing is free — your home&apos;s perfect
                match is already looking.
              </p>
              <ButtonLink href="/dashboard/home/new" variant="seller" className="mt-4">
                Start a listing
              </ButtonLink>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {myHomes.map((h) => {
                const st = statusLabels[h.status];
                return (
                  <li key={h.id}>
                    <Link
                      href={`/dashboard/home/${h.id}`}
                      className="block rounded-2xl border border-hairline p-4 transition-colors hover:bg-soft"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{h.headline}</p>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-charcoal-soft">
                        {areaLabel(h.areaId)} · {formatPrice(h.price)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* My Quiet Seeker brief */}
        <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl">
              <Heart className="h-5 w-5 fill-blue-deep text-blue-deep" /> My
              Quiet Seeker brief
            </h2>
            {brief && (
              <Link
                href="/dashboard/brief"
                className="text-sm font-semibold text-blue-deep hover:underline"
              >
                Edit
              </Link>
            )}
          </div>
          {!brief ? (
            <div className="mt-4">
              <p className="text-sm text-charcoal-soft">
                No brief yet. Tell the Matchlist what you&apos;re looking for —
                anywhere in Scotland.
              </p>
              <ButtonLink href="/dashboard/brief" variant="seeker" className="mt-4">
                Build my brief
              </ButtonLink>
            </div>
          ) : (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-charcoal-soft">Areas</dt>
                <dd className="text-right font-medium">
                  {brief.areas.map(areaShortLabel).join(" · ") || "Anywhere"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-charcoal-soft">Budget</dt>
                <dd className="font-medium">
                  {formatBudget(brief.budgetMin, brief.budgetMax)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-charcoal-soft">Needs</dt>
                <dd className="text-right font-medium">
                  {brief.minBeds}+ beds · {brief.minBaths}+ baths
                  {brief.garden === "must-have" && " · garden essential"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-charcoal-soft">Types</dt>
                <dd className="text-right font-medium">
                  {brief.types.length
                    ? brief.types
                        .map(
                          (t) =>
                            PROPERTY_TYPES.find((p) => p.value === t)?.label ?? t,
                        )
                        .join(", ")
                    : "Open to anything"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-charcoal-soft">Position</dt>
                <dd className="text-right font-medium">
                  {BUYING_POSITIONS.find((p) => p.value === brief.position)?.label}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-hairline pt-2">
                <dt className="text-charcoal-soft">Agreement</dt>
                <dd
                  className={
                    brief.contract
                      ? "font-semibold text-green-deep"
                      : "font-semibold text-red-deep"
                  }
                >
                  {brief.contract
                    ? `Signed ${new Date(brief.contract.signedAt).toLocaleDateString("en-GB")}`
                    : "Not signed — matching paused"}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* My raised hands — seekers I've clicked as a home owner */}
      {outgoingIntros.length > 0 && (
        <section className="mt-10">
          <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
            <h2 className="flex items-center gap-2 text-xl">
              <Heart className="h-5 w-5 fill-orange text-orange" /> Seekers
              I&apos;ve raised my hand for
            </h2>
            <p className="mt-1 text-sm text-charcoal-soft">
              We offer them the introduction once your home profile and Home
              Report are in place. Their identity is never shared unless they
              say yes.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {outgoingIntros.map((intro) => {
                const seekerBrief = getBrief(intro.seekerId);
                const label =
                  intro.status === "new"
                    ? myHomes.length === 0
                      ? "Waiting on your home profile"
                      : "With Matchlisted — preparing the offer"
                    : intro.status === "offered"
                      ? "Offered — waiting on their answer"
                      : intro.status === "accepted"
                        ? "Accepted — you're introduced"
                        : "They passed this time";
                return (
                  <li
                    key={intro.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-soft px-4 py-3"
                  >
                    <Link
                      href={`/seekers/${seekerBrief?.publicRef ?? ""}`}
                      className="font-medium hover:underline"
                    >
                      {seekerBrief?.publicRef} — {seekerBrief?.headline}
                    </Link>
                    <span
                      className={
                        intro.status === "accepted"
                          ? "font-semibold text-green-deep"
                          : intro.status === "declined"
                            ? "font-semibold text-charcoal-soft"
                            : "font-semibold text-blue-deep"
                      }
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
            {myHomes.length === 0 && (
              <ButtonLink href="/dashboard/home/new" variant="seller" className="mt-4">
                Finish my Hush Home profile
              </ButtonLink>
            )}
          </div>
        </section>
      )}

      {/* Activity */}
      {(upcoming.length > 0 || offers.length > 0) && (
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {upcoming.length > 0 && (
            <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
              <h2 className="flex items-center gap-2 text-xl">
                <CalendarClock className="h-5 w-5 text-blue-deep" /> Upcoming
                viewings
              </h2>
              <ul className="mt-4 space-y-2 text-sm">
                {upcoming.map((v) => (
                  <li key={v.id} className="rounded-xl bg-soft px-4 py-3">
                    <Link href={`/homes/${v.homeId}`} className="font-medium hover:underline">
                      {formatDateTime(v.start)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {offers.length > 0 && (
            <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
              <h2 className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-orange-deep" /> My offers
              </h2>
              <ul className="mt-4 space-y-2 text-sm">
                {offers.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-3"
                  >
                    <span>
                      {formatPrice(o.amount)} —{" "}
                      <span className="capitalize">{o.status}</span>
                      {o.status === "countered" && o.counterAmount
                        ? ` at ${formatPrice(o.counterAmount)}`
                        : ""}
                    </span>
                    {o.status === "countered" ? (
                      <Link
                        href={`/homes/${o.homeId}/offer?counter=${o.id}`}
                        className="font-semibold text-orange-deep underline"
                      >
                        Respond
                      </Link>
                    ) : (
                      <Link
                        href={`/homes/${o.homeId}`}
                        className="font-semibold text-blue-deep underline"
                      >
                        View
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </Container>
  );
}
