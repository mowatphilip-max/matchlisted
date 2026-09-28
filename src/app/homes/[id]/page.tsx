import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  BedDouble,
  Bath,
  CalendarCheck,
  FileDown,
  MapPin,
  Trees,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { MatchRing } from "@/components/match-ring";
import { HeartButton } from "@/components/heart-button";
import { PropertyImage } from "@/components/property-image";
import { currentUser } from "@/lib/session";
import {
  getBrief,
  introductionsForSeeker,
  matchWeights,
  savedForSeeker,
  slotsForHome,
  viewingsForSeeker,
  getHomeFor,
} from "@/lib/db";
import { scoreMatch, matchLine } from "@/lib/match";
import { bookViewing } from "@/lib/actions";
import { areaLabel } from "@/lib/areas";
import { formatPrice, formatTimeRange } from "@/lib/format";
import { HOME_REPORT_SUPPLIERS } from "@/lib/site";
import { FEATURE_TAGS, PROPERTY_TYPES } from "@/lib/types";

export const metadata: Metadata = { title: "Hush Home" };

export default async function HomeProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booked?: string; offer?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const { booked, offer } = await searchParams;
  // getHomeFor is the §3 visibility scope: public statuses, the owner, an
  // admin, or a seeker whose accepted Introduction opens this exact door.
  const home = await getHomeFor(id, user);
  if (!home) notFound();
  const isSeller = home.sellerId === user.id;
  const introduced = (await introductionsForSeeker(user.id)).some(
    (i) => i.homeId === home.id && i.status === "accepted",
  );

  const brief = await getBrief(user.id);
  const registered = Boolean(brief?.contract);
  const match =
    registered && brief && !isSeller
      ? scoreMatch(home, brief, await matchWeights())
      : null;
  const saved = (await savedForSeeker(user.id)).some((s) => s.homeId === home.id);
  const openSlots = (await slotsForHome(home.id)).filter((s) => !s.bookedBy);
  const myViewings = (await viewingsForSeeker(user.id)).filter(
    (v) => v.homeId === home.id,
  );
  const canOffer = myViewings.some(
    (v) => v.status === "completed" && v.stillInterested,
  );
  const typeLabel =
    PROPERTY_TYPES.find((t) => t.value === home.type)?.label ?? home.type;

  return (
    <Container className="py-10">
      {booked && (
        <p className="mb-6 rounded-2xl bg-green-tint p-4 text-sm font-medium text-green-deep">
          Viewing booked, and the seller has been told. After the viewing,
          we&apos;ll ask how it went.
        </p>
      )}
      {offer === "submitted" && (
        <p className="mb-6 rounded-2xl bg-green-tint p-4 text-sm font-medium text-green-deep">
          Offer submitted. It&apos;s with the seller now, and you&apos;ll hear the
          moment they respond.
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative">
            <PropertyImage
              src={home.photos[0] ?? null}
              alt={home.headline}
              placeholderKey={home.id}
              className="aspect-[16/10] w-full rounded-[var(--radius-xl)]"
            />
            {!isSeller && (
              <div className="absolute right-4 top-4">
                <HeartButton homeId={home.id} saved={saved} />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-charcoal-soft">
                <MapPin className="h-4 w-4 text-blue-deep" />
                {areaLabel(home.areaId)} · exact address shared at viewing
              </p>
              <h1 className="mt-2 text-3xl">{home.headline}</h1>
              <p className="mt-2 font-display text-2xl font-bold">
                {formatPrice(home.price)}
              </p>
            </div>
            {match && <MatchRing pct={match.pct} size="lg" animate />}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-charcoal-soft">
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="h-4 w-4" /> {home.beds} bedrooms
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bath className="h-4 w-4" /> {home.baths} bathrooms
            </span>
            {home.garden && (
              <span className="inline-flex items-center gap-1.5">
                <Trees className="h-4 w-4" /> Garden
              </span>
            )}
            <span>{typeLabel}</span>
          </div>

          {home.features.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {home.features.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-soft px-3 py-1 text-xs font-medium"
                >
                  {FEATURE_TAGS.find((t) => t.value === f)?.label ?? f}
                </span>
              ))}
            </div>
          )}

          <p className="mt-6 max-w-2xl leading-relaxed text-charcoal">
            {home.description}
          </p>

          {match && (
            <div className="mt-8 rounded-[var(--radius-lg)] bg-soft p-6">
              <h2 className="text-xl">{matchLine(match.pct)}</h2>
              <ul className="mt-4 space-y-2">
                {match.components.map((c) => (
                  <li key={c.key} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 font-semibold">{c.label}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-hairline">
                      <span
                        className="block h-full rounded-full bg-orange"
                        style={{ width: `${Math.round(c.score * 100)}%` }}
                      />
                    </span>
                    <span className="w-44 shrink-0 text-right text-xs text-charcoal-soft">
                      {c.detail}
                    </span>
                  </li>
                ))}
              </ul>
              {match.gated && (
                <p className="mt-3 text-xs font-medium text-red-deep">
                  {match.gated}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action rail */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Home Report */}
          <div className="rounded-[var(--radius-lg)] bg-paper p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline">
            <h2 className="text-base font-bold">Home Report</h2>
            {home.homeReport.status === "verified" ? (
              registered ? (
                <a
                  href={`/homes/${home.id}/report`}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-white hover:bg-charcoal-deep"
                >
                  <FileDown className="h-4 w-4" /> Download (verified)
                </a>
              ) : (
                <p className="mt-2 text-sm text-charcoal-soft">
                  Downloadable by registered Quiet Seekers.
                </p>
              )
            ) : (
              <p className="mt-2 text-sm text-charcoal-soft">
                Report pending verification.
              </p>
            )}
            <p className="mt-2 text-xs text-charcoal-soft">
              Professionally surveyed value by{" "}
              {HOME_REPORT_SUPPLIERS.find(
                (s) => s.id === home.homeReport.supplier,
              )?.name ?? "surveyor TBC"}
              .
            </p>
          </div>

          {/* Viewings */}
          {!isSeller && (
            <div className="rounded-[var(--radius-lg)] bg-paper p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline">
              <h2 className="text-base font-bold">Arrange a viewing</h2>
              {!registered ? (
                <p className="mt-2 text-sm text-charcoal-soft">
                  Sign your Quiet Seeker agreement to book viewings.
                </p>
              ) : myViewings.some((v) => v.status === "booked") ? (
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-green-deep">
                  <CalendarCheck className="h-4 w-4" /> You&apos;re booked in.
                </p>
              ) : openSlots.length === 0 ? (
                <p className="mt-2 text-sm text-charcoal-soft">
                  No open slots right now. Save the home and we&apos;ll nudge
                  you when new times appear.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {openSlots.map((s) => (
                    <li key={s.id}>
                      <form
                        action={bookViewing}
                        className="flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-2.5"
                      >
                        <span className="text-sm">
                          {formatTimeRange(s.start, s.end)}
                        </span>
                        <input type="hidden" name="slotId" value={s.id} />
                        <SubmitButton
                          variant="seeker"
                          size="sm"
                          pendingLabel="Booking…"
                        >
                          Book
                        </SubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Offer */}
          {!isSeller && registered && (
            <div className="rounded-[var(--radius-lg)] bg-paper p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline">
              <h2 className="text-base font-bold">Ready to commit?</h2>
              {canOffer ? (
                <>
                  <p className="mt-2 text-sm text-charcoal-soft">
                    You&apos;ve viewed and you&apos;re still interested. Send the
                    seller a Note of Offer. No solicitor needed, nothing to pay.
                  </p>
                  <ButtonLink href={`/homes/${home.id}/offer`} className="mt-3 w-full">
                    Make an offer
                  </ButtonLink>
                </>
              ) : (
                <p className="mt-2 text-sm text-charcoal-soft">
                  Offers open after a viewing. Tell us you&apos;re still
                  interested in your post-viewing feedback and the offer flow
                  unlocks here.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}
