import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  Check,
  Heart,
  Home,
  Lock,
  MapPin,
  Trees,
  UserRound,
  Wallet,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button, ButtonLink } from "@/components/ui/button";
import { SeekerCard, positionLabel } from "@/components/seeker-card";
import { expressInterestInSeeker } from "@/lib/actions";
import { areaLabel } from "@/lib/areas";
import { formatBudget, formatDate } from "@/lib/format";
import {
  activeBriefs,
  findIntroduction,
  getBriefByPublicRef,
  homesBySeller,
} from "@/lib/db";
import { MowattSeekerCard } from "@/components/seekers/mowatt-seeker-card";
import { findMowattSeeker, toBriefLike } from "@/lib/mowatt-bridge";
import { fetchMowattSeekers, type MowattSeeker } from "@/lib/mowatt-seekers";
import { currentUser } from "@/lib/session";
import { FEATURE_TAGS, PROPERTY_TYPES, type SeekerBrief } from "@/lib/types";

export const dynamic = "force-dynamic";

const GARDEN_LABELS = {
  "no-preference": "No preference",
  "nice-to-have": "Nice to have",
  "must-have": "Must have",
} as const;

/** Resolve a ref: native contract-signed brief first, then the live sheets. */
async function resolveSeeker(rawRef: string): Promise<{
  brief: SeekerBrief;
  sheet: boolean;
  matched: boolean;
} | null> {
  const ref = decodeURIComponent(rawRef);
  const native = await getBriefByPublicRef(ref);
  if (native?.contract) return { brief: native, sheet: false, matched: false };
  const mowatt = await findMowattSeeker(ref);
  if (!mowatt) return null;
  return { brief: toBriefLike(mowatt), sheet: true, matched: !mowatt.active };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ref: string }>;
}): Promise<Metadata> {
  const { ref } = await params;
  const resolved = await resolveSeeker(ref);
  if (!resolved) return { title: "Quiet Seeker not found" };
  return {
    title: `${resolved.brief.publicRef} — ${resolved.brief.headline}`,
    description: resolved.brief.story.slice(0, 155),
  };
}

export default async function SeekerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ interested?: string }>;
}) {
  const { ref } = await params;
  const { interested } = await searchParams;
  const resolved = await resolveSeeker(ref);
  if (!resolved) notFound();
  const { brief, sheet, matched } = resolved;

  const user = await currentUser();
  const isSelf = user?.id === brief.userId;
  const existing = user ? await findIntroduction(brief.userId, user.id) : undefined;
  const hasHome = user ? (await homesBySeller(user.id)).length > 0 : false;

  // Nearby seekers: native briefs by shared area id, or for sheet seekers,
  // other live sheet profiles that share a town.
  let others: SeekerBrief[] = [];
  let sheetOthers: MowattSeeker[] = [];
  if (sheet) {
    const { seekers } = await fetchMowattSeekers();
    const mine = seekers.find((s) => s.ref === brief.publicRef);
    sheetOthers = seekers
      .filter(
        (s) =>
          s.active &&
          s.ref !== brief.publicRef &&
          s.towns.some((t) => mine?.towns.includes(t)),
      )
      .slice(0, 3);
  } else {
    others = (await activeBriefs())
      .filter(
        (b) =>
          b.publicRef !== brief.publicRef &&
          b.areas.some((a) => brief.areas.includes(a)),
      )
      .slice(0, 3);
  }

  const criteria = [
    {
      icon: Wallet,
      label: "Budget",
      value: formatBudget(brief.budgetMin, brief.budgetMax),
    },
    { icon: BedDouble, label: "Bedrooms", value: `${brief.minBeds}+` },
    { icon: Bath, label: "Bathrooms", value: `${brief.minBaths}+` },
    { icon: Trees, label: "Garden", value: GARDEN_LABELS[brief.garden] },
    {
      icon: Home,
      label: "Property types",
      value:
        brief.types.length === 0
          ? "Open to anything"
          : brief.types
              .map((t) => PROPERTY_TYPES.find((p) => p.value === t)?.label ?? t)
              .join(", "),
    },
  ];
  const featureLabels = brief.features.map(
    (f) => FEATURE_TAGS.find((t) => t.value === f)?.label ?? f,
  );

  return (
    <>
      <section className="bg-soft pb-14 pt-10 sm:pt-14">
        <Container>
          <Link
            href="/seekers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-soft transition-colors hover:text-charcoal"
          >
            <ArrowLeft className="h-4 w-4" />
            All Quiet Seekers
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-tint text-blue-deep ring-1 ring-hairline">
                  <UserRound className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-sm font-bold text-blue-deep">
                    Quiet Seeker · {brief.publicRef}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-charcoal-soft">
                    <BadgeCheck className="h-3.5 w-3.5 text-blue-deep" />
                    {brief.contract
                      ? `Verified — agreement signed ${formatDate(brief.contract.signedAt)}`
                      : "Registered buyer on the Mowatt Matchlist"}
                  </p>
                </div>
              </div>

              <h1 className="mt-5 max-w-xl text-3xl sm:text-4xl">
                {brief.headline}
              </h1>

              <p className="mt-3 inline-flex rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-charcoal shadow-sm ring-1 ring-hairline">
                {positionLabel(brief)}
              </p>

              <ul className="mt-5 flex flex-wrap items-center gap-2">
                <li className="flex items-center gap-1.5 text-sm text-charcoal-soft">
                  <MapPin className="h-4 w-4 text-blue-deep" />
                  Looking in
                </li>
                {brief.areas.map((a) => (
                  <li
                    key={a}
                    className="rounded-full bg-blue-tint px-3 py-1 text-xs font-medium text-blue-deep"
                  >
                    {areaLabel(a)}
                  </li>
                ))}
              </ul>

              <blockquote className="mt-8 max-w-2xl border-l-4 border-blue-deep pl-5 text-lg leading-relaxed text-charcoal-soft">
                &ldquo;{brief.story}&rdquo;
              </blockquote>

              {featureLabels.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-charcoal-soft">
                    On their wish list
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {featureLabels.map((f) => (
                      <li
                        key={f}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-charcoal ring-1 ring-hairline"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside>
              <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-deep">
                  The brief at a glance
                </h2>
                <dl className="mt-4 space-y-3">
                  {criteria.map((c) => (
                    <div
                      key={c.label}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <dt className="flex items-center gap-2 text-charcoal-soft">
                        <c.icon className="h-4 w-4 shrink-0" />
                        {c.label}
                      </dt>
                      <dd className="text-right font-semibold text-charcoal">
                        {c.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* The one door: register a Hush Home to reach this seeker. */}
              <div className="mt-5 rounded-[var(--radius-lg)] bg-charcoal-deep p-6 text-white">
                {matched ? (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                      <Check className="h-5 w-5" />
                    </span>
                    <h2 className="mt-3 text-xl text-white">
                      This buyer has found their home.
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">
                      Matched through the Matchlist — the quiet route works.
                      Plenty of other verified buyers are still looking.
                    </p>
                    <ButtonLink href="/seekers" className="mt-5 w-full" variant="onDark">
                      See who&apos;s still looking
                    </ButtonLink>
                  </>
                ) : isSelf ? (
                  <>
                    <h2 className="text-xl text-white">
                      This is your public profile.
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">
                      This is exactly what sellers see: your story and your
                      brief, never your name. Edit it any time from your
                      dashboard.
                    </p>
                    <ButtonLink
                      href="/dashboard/brief"
                      className="mt-5 w-full"
                      variant="onDark"
                    >
                      Edit my brief
                    </ButtonLink>
                  </>
                ) : interested || existing ? (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                      <Check className="h-5 w-5" />
                    </span>
                    <h2 className="mt-3 text-xl text-white">
                      {existing?.status === "accepted"
                        ? "They said yes — you're introduced."
                        : existing?.status === "declined"
                          ? "They passed this time."
                          : "Noted — we'll make the approach."}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">
                      {existing?.status === "accepted"
                        ? "This seeker accepted the introduction to your home. Watch your notifications for viewings and next steps."
                        : existing?.status === "declined"
                          ? "This seeker decided your home wasn't quite the one. Your details were never shared. The Matchlist keeps scoring your home against every other live seeker."
                          : "Once your Hush Home profile is complete and its Home Report is verified, we'll offer this seeker the introduction. It's their choice — and neither side's identity is shared until you're both ready."}
                    </p>
                    {!hasHome && existing?.status === "new" && (
                      <ButtonLink href="/dashboard/home/new" className="mt-5 w-full">
                        Finish my Hush Home profile
                      </ButtonLink>
                    )}
                  </>
                ) : (
                  <>
                    <Heart className="h-6 w-6 fill-orange text-orange" />
                    <h2 className="mt-3 text-xl text-white">
                      Could your home be the one?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">
                      If you think this seeker might want to buy your home,
                      raise your hand. You can&apos;t contact them directly —
                      list your home as a Hush Home (free) and we&apos;ll
                      offer them the introduction once your profile and Home
                      Report are in place.
                    </p>
                    {user ? (
                      <form action={expressInterestInSeeker} className="mt-5">
                        <input
                          type="hidden"
                          name="seekerRef"
                          value={brief.publicRef}
                        />
                        <Button type="submit" className="w-full">
                          They might want my home
                        </Button>
                      </form>
                    ) : (
                      <ButtonLink
                        href={`/join?as=seller&seeker=${encodeURIComponent(brief.publicRef)}`}
                        className="mt-5 w-full"
                      >
                        They might want my home
                      </ButtonLink>
                    )}
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-white/60">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Their identity stays hidden, and so does yours — the
                      introduction only happens when both sides are registered
                      and they say yes.
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {(others.length > 0 || sheetOthers.length > 0) && (
        <section className="border-t border-hairline py-14">
          <Container>
            <h2 className="text-2xl">More seekers in the same areas</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sheetOthers.map((s) => (
                <MowattSeekerCard key={s.ref} seeker={s} />
              ))}
              {others.map((b) => (
                <SeekerCard key={b.publicRef} brief={b} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
