import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarPlus,
  Check,
  CircleDashed,
  FileCheck2,
  FileUp,
  ImagePlus,
  PenLine,
  Trash2,
  UserRound,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { PropertyImage } from "@/components/property-image";
import { SeekerMatchCard } from "@/components/seeker-match-card";
import { currentUser } from "@/lib/session";
import {
  getInvoice,
  getHomeUnscoped,
  usersById,
  offersForHome,
  slotsForHome,
  viewingsForHome,
} from "@/lib/db";
import { matchesForHome } from "@/lib/matches";
import {
  addViewingSlot,
  deleteViewingSlot,
  orderHomeReport,
  removeHomePhoto,
  respondToOffer,
  uploadHomePhotos,
  uploadHomeReport,
} from "@/lib/actions";
import { areaLabel } from "@/lib/areas";
import { formatMoney, formatPrice, formatTimeRange, formatDate } from "@/lib/format";
import {
  HOME_REPORT_SUPPLIERS,
  homeReportQuote,
} from "@/lib/site";
import { SELLER_HOME_MESSAGES, messageFor } from "@/lib/page-messages";

export const metadata: Metadata = { title: "My Hush Home" };

function Step({
  done,
  active,
  label,
}: {
  done: boolean;
  active?: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <span className="rounded-full bg-green-tint p-1 text-green-deep">
          <Check className="h-4 w-4" />
        </span>
      ) : (
        <span
          className={
            active
              ? "rounded-full bg-orange-tint p-1 text-orange-deep"
              : "rounded-full bg-soft p-1 text-charcoal-soft"
          }
        >
          <CircleDashed className="h-4 w-4" />
        </span>
      )}
      <span
        className={
          done
            ? "text-sm font-medium text-green-deep"
            : active
              ? "text-sm font-semibold"
              : "text-sm text-charcoal-soft"
        }
      >
        {label}
      </span>
    </li>
  );
}

export default async function SellerHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    uploaded?: string;
    ordered?: string;
  }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const { error, uploaded, ordered } = await searchParams;
  const home = await getHomeUnscoped(id);
  if (!home || home.sellerId !== user.id) notFound();

  // These arrive as `?error=report-size`, `?uploaded=1`, `?ordered=1` from the
  // server actions. The error is value-keyed; the two successes are flags, so
  // they resolve by param name. At most one shows — errors first.
  const message =
    messageFor(SELLER_HOME_MESSAGES, error) ??
    (uploaded ? SELLER_HOME_MESSAGES.uploaded : null) ??
    (ordered ? SELLER_HOME_MESSAGES.ordered : null);

  const report = home.homeReport;
  const contractSigned = home.contract !== null;
  const reportInvoice = report.invoiceId ? await getInvoice(report.invoiceId) : undefined;
  const awaitingPayment =
    reportInvoice?.status === "due" && report.status === "none";

  const slots = await slotsForHome(home.id);
  const viewings = await viewingsForHome(home.id);
  const offers = await offersForHome(home.id);
  // Buyer names for the offers list, resolved before render.
  const offerSeekers = await usersById();
  const matches = (await matchesForHome(home)).slice(0, 3);
  const isLive = home.status === "live" || home.status === "under-offer";

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-orange-deep">
            My Hush Home
          </p>
          <h1 className="mt-1 text-3xl">{home.headline}</h1>
          <p className="mt-1 text-charcoal-soft">
            {areaLabel(home.areaId)} · {home.addressLine} ·{" "}
            {formatPrice(home.price)}
          </p>
        </div>
        <ButtonLink
          href={`/dashboard/home/${home.id}/edit`}
          variant="secondary"
          className="min-h-9 px-4 py-1.5"
        >
          <PenLine className="h-4 w-4" /> Edit profile
        </ButtonLink>
      </div>

      {message && (
        <Alert tone={message.tone} title={message.title} className="mt-8">
          {message.body}
        </Alert>
      )}

      {/* Go-live checklist */}
      <div className="mt-8 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
        <h2 className="text-xl">Road to live</h2>
        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          <Step done label="Profile built" />
          <Step
            done={contractSigned}
            active={!contractSigned}
            label="Seller agreement signed"
          />
          <Step
            done={report.status === "verified" || report.status === "uploaded"}
            active={contractSigned && (report.status === "none" || report.status === "ordered")}
            label="Home Report completed"
          />
          <Step
            done={isLive || home.status === "sold"}
            active={report.status === "uploaded"}
            label="Live on the Matchlist"
          />
        </ul>

        {/* Next action */}
        {!contractSigned && (
          <div className="mt-5 rounded-2xl bg-orange-tint p-4">
            <p className="text-sm">
              <strong>Next: sign your seller agreement.</strong> No listing
              fee, no commission, no withdrawal fee. You agree to sell only
              through Matchlisted, and the only cost you ever bear is your
              Home Report.
            </p>
            <ButtonLink
              href={`/dashboard/home/${home.id}/contract`}
              variant="seller"
              className="mt-3 min-h-9 px-4 py-1.5"
            >
              Read & sign
            </ButtonLink>
          </div>
        )}

        {contractSigned && report.status === "none" && !awaitingPayment && (
          <div className="mt-5 rounded-2xl bg-blue-tint p-4">
            <p className="text-sm">
              <strong>Next: your Home Report.</strong> Your listing cannot go
              fully live without one: it verifies your home&apos;s value and
              anchors every Match %. Fees are banded on your estimate of{" "}
              <strong>{formatPrice(home.price)}</strong> (corrected later if
              the report says otherwise). You pay here; the surveyor bills us.
            </p>
            {homeReportQuote("allied-surveyors", home.price) ? (
              <form
                action={orderHomeReport}
                className="mt-4 grid gap-3 sm:grid-cols-3"
              >
                <input type="hidden" name="homeId" value={home.id} />
                {HOME_REPORT_SUPPLIERS.map((s, i) => {
                  const q = homeReportQuote(s.id, home.price);
                  if (!q) return null;
                  return (
                    <label
                      key={s.id}
                      className="cursor-pointer rounded-2xl border border-hairline bg-white p-4 text-sm transition-colors has-[:checked]:border-blue-deep has-[:checked]:ring-1 has-[:checked]:ring-blue-deep"
                    >
                      <input
                        type="radio"
                        name="supplier"
                        value={s.id}
                        defaultChecked={i === 0}
                        className="mr-2 accent-[var(--color-blue-deep)]"
                      />
                      <span className="font-bold">{s.name}</span>
                      <span className="mt-1 block text-xs text-charcoal-soft">
                        {s.blurb}
                      </span>
                      <span className="mt-3 block font-display text-2xl font-bold">
                        {formatMoney(q.total)}
                      </span>
                      <span className="mt-1 block text-xs text-charcoal-soft">
                        {formatMoney(q.base)} fee + {formatMoney(q.vat)} VAT +{" "}
                        {formatMoney(q.margin)} arrangement
                        {s.indicative ? " · indicative" : ""}
                      </span>
                    </label>
                  );
                })}
                <div className="sm:col-span-3">
                  <label htmlFor="hr-phone" className="block text-sm font-semibold">
                    Your phone number
                  </label>
                  <p className="text-xs text-charcoal-soft">
                    The surveyor calls you directly to arrange the visit.
                  </p>
                  <input
                    id="hr-phone"
                    name="phone"
                    type="tel"
                    required
                    defaultValue={user.phone ?? ""}
                    placeholder="07700 900123"
                    className="mt-1.5 min-h-11 w-full max-w-xs rounded-xl border border-hairline bg-white px-4 text-base focus:border-blue-deep"
                  />
                </div>
                <div className="sm:col-span-3">
                  <SubmitButton pendingLabel="Booking your Home Report…">
                    Book & pay for my Home Report
                  </SubmitButton>
                </div>
              </form>
            ) : (
              <p className="mt-4 rounded-xl bg-white p-4 text-sm">
                <strong>Homes estimated over £1,500,000 are quoted by
                negotiation.</strong>{" "}
                We&apos;ll arrange your Home Report personally. Email{" "}
                <a href="mailto:office@matchlisted.com" className="font-semibold text-blue-text underline">
                  office@matchlisted.com
                </a>{" "}
                and we&apos;ll come back with a fixed quote.
              </p>
            )}
          </div>
        )}

        {awaitingPayment && reportInvoice && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-orange-tint p-4">
            <p className="text-sm">
              <strong>Home Report ordered, payment pending.</strong>{" "}
              {reportInvoice.description}
            </p>
            <ButtonLink href={`/pay/${reportInvoice.id}`} className="min-h-9 px-4 py-1.5">
              Pay {formatMoney(reportInvoice.net + reportInvoice.vat)}
            </ButtonLink>
          </div>
        )}

        {report.status === "ordered" && (
          <div className="mt-5 rounded-2xl bg-blue-tint p-4">
            <p className="text-sm">
              <strong>Home Report booked & paid</strong>
              {report.poId ? ` (ref ${report.poId})` : ""}.{" "}
              {HOME_REPORT_SUPPLIERS.find((s) => s.id === report.supplier)?.name}{" "}
              were instructed{" "}
              {report.orderedAt ? formatDate(report.orderedAt) : ""} and will
              phone you to arrange the visit. When the completed report
              arrives, upload it here. Once verified, your home goes fully
              live and the report becomes downloadable to registered Quiet
              Seekers.
            </p>
            <form
              action={uploadHomeReport}
              className="mt-3 flex flex-wrap items-center gap-3"
            >
              <input type="hidden" name="homeId" value={home.id} />
              <input
                type="file"
                name="report"
                accept=".pdf"
                required
                className="text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <SubmitButton
                variant="seller"
                className="min-h-9 px-4 py-1.5"
                pendingLabel="Uploading your report…"
              >
                <FileUp className="h-4 w-4" /> Upload report
              </SubmitButton>
            </form>
          </div>
        )}

        {report.status === "uploaded" && (
          <p className="mt-5 rounded-2xl bg-blue-tint p-4 text-sm">
            <strong>Report uploaded and under review.</strong> The Matchlisted
            team verifies every Home Report before a listing goes live.
            You&apos;ll be notified the moment it clears.
          </p>
        )}

        {report.status === "verified" && (
          <p className="mt-5 flex items-center gap-2 rounded-2xl bg-green-tint p-4 text-sm text-green-deep">
            <FileCheck2 className="h-5 w-5" />
            <span>
              <strong>Home Report verified</strong>
              {report.fileName ? ` (${report.fileName})` : ""} and downloadable
              by registered Quiet Seekers.
            </span>
          </p>
        )}
      </div>

      {/* Photos — the seller's own, uploadable at any stage */}
      <section id="photos" className="mt-10 scroll-mt-20">
        <h2 className="text-2xl">Photos</h2>
        <p className="mt-1 text-sm text-charcoal-soft">
          Upload your own photos whenever you like, before the Home Report is
          even ordered. They only show to buyers once the listing is live, and
          profiles with photos get more Introductions.
        </p>
        <div className="mt-5 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
          {home.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {home.photos.map((src, i) => (
                <div key={i} className="group relative">
                  <PropertyImage
                    src={src}
                    alt={`Photo ${i + 1} of ${home.headline}`}
                    placeholderKey={home.id}
                    className="aspect-[4/3] w-full rounded-xl"
                  />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-charcoal/80 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Cover
                    </span>
                  )}
                  <form action={removeHomePhoto} className="absolute right-2 top-2">
                    <input type="hidden" name="homeId" value={home.id} />
                    <input type="hidden" name="index" value={i} />
                    <button
                      type="submit"
                      aria-label={`Remove photo ${i + 1}`}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-charcoal-soft shadow-sm ring-1 ring-hairline transition-colors hover:text-red-deep"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-charcoal-soft">
              No photos yet. The first one you upload becomes the cover.
            </p>
          )}
          {home.photos.length < 8 && (
            <form
              action={uploadHomePhotos}
              className="mt-4 flex flex-wrap items-center gap-3 border-t border-hairline pt-4"
            >
              <input type="hidden" name="homeId" value={home.id} />
              <input
                type="file"
                name="photos"
                accept="image/*"
                multiple
                required
                className="text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <SubmitButton
                variant="seller"
                className="min-h-9 px-4 py-1.5"
                pendingLabel="Uploading your photos…"
              >
                <ImagePlus className="h-4 w-4" /> Upload photos
              </SubmitButton>
              <span className="text-xs text-charcoal-soft">
                Up to 8 photos · JPG/PNG/HEIC · we resize them for you
              </span>
            </form>
          )}
        </div>
      </section>

      {/* Matching seekers */}
      <section className="mt-10">
        <h2 className="text-2xl">Quiet Seekers matching this home</h2>
        <p className="mt-1 text-sm text-charcoal-soft">
          Anonymised: sellers never see names or contact details.
        </p>
        {matches.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <SeekerMatchCard key={m.seekerId} match={m} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon={UserRound}
            title="No matching Quiet Seekers yet"
            action={
              <ButtonLink href="/seekers" variant="seeker">
                Browse every Quiet Seeker
              </ButtonLink>
            }
          >
            New Quiet Seekers register all the time. Look through everyone
            searching in Scotland and raise your hand to anyone this home
            could suit.
          </EmptyState>
        )}
      </section>

      {/* Viewing slots */}
      <section id="viewings" className="mt-10 scroll-mt-20">
        <h2 className="text-2xl">Viewing diary</h2>
        <p className="mt-1 text-sm text-charcoal-soft">
          Offer times that suit you; registered seekers book directly.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
            <h3 className="text-base font-bold">Open slots</h3>
            {slots.filter((s) => !s.bookedBy).length === 0 ? (
              <p className="mt-2 text-sm text-charcoal-soft">
                No open slots. Add some below.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {slots
                  .filter((s) => !s.bookedBy)
                  .map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-2.5 text-sm"
                    >
                      {formatTimeRange(s.start, s.end)}
                      <form action={deleteViewingSlot}>
                        <input type="hidden" name="slotId" value={s.id} />
                        <button
                          aria-label="Remove slot"
                          className="cursor-pointer text-charcoal-soft hover:text-red-deep"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </li>
                  ))}
              </ul>
            )}
            <form
              action={addViewingSlot}
              className="mt-4 flex flex-wrap items-end gap-2 border-t border-hairline pt-4"
            >
              <input type="hidden" name="homeId" value={home.id} />
              <div>
                <label htmlFor="slot-date" className="block text-xs font-semibold">
                  Date
                </label>
                <input
                  id="slot-date"
                  type="date"
                  name="date"
                  required
                  className="mt-1 min-h-10 rounded-xl border border-hairline px-3 text-base"
                />
              </div>
              <div>
                <label htmlFor="slot-time" className="block text-xs font-semibold">
                  Time
                </label>
                <input
                  id="slot-time"
                  type="time"
                  name="time"
                  required
                  className="mt-1 min-h-10 rounded-xl border border-hairline px-3 text-base"
                />
              </div>
              <SubmitButton
                variant="seller"
                className="min-h-10 px-4 py-1.5"
                pendingLabel="Adding your slot…"
              >
                <CalendarPlus className="h-4 w-4" /> Add 30-min slot
              </SubmitButton>
            </form>
          </div>

          <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
            <h3 className="text-base font-bold">Booked & feedback</h3>
            {viewings.length === 0 ? (
              <p className="mt-2 text-sm text-charcoal-soft">
                No viewings booked yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {viewings.map((v) => (
                  <li key={v.id} className="rounded-xl bg-soft p-4 text-sm">
                    <p className="font-medium">{formatTimeRange(v.start, v.end)}</p>
                    {v.status === "completed" ? (
                      <>
                        <p className="mt-1 text-charcoal-soft">
                          “{v.feedback || "No written feedback."}”
                        </p>
                        <p
                          className={
                            v.stillInterested
                              ? "mt-1 font-semibold text-green-deep"
                              : "mt-1 font-semibold text-charcoal-soft"
                          }
                        >
                          {v.stillInterested
                            ? "Still interested ✓"
                            : "Not taking it further"}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-charcoal-soft">
                        Booked. Feedback comes after the viewing.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Offers */}
      <section className="mt-10">
        <h2 className="text-2xl">Offers</h2>
        {offers.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={FileCheck2}
            title="No offers yet"
            action={
              <ButtonLink href="#viewings" variant="seller">
                Add viewing times
              </ButtonLink>
            }
          >
            Offers arrive here the moment a seeker submits one, and you can
            accept, decline or counter. Offers follow viewings, so keep your
            diary stocked.
          </EmptyState>
        ) : (
          <ul className="mt-6 space-y-4">
            {offers.map((o) => {
              const seeker = offerSeekers.get(o.seekerId);
              return (
                <li
                  key={o.id}
                  className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-display text-2xl font-bold">
                      {formatPrice(o.amount)}
                      {o.status === "countered" && o.counterAmount && (
                        <span className="ml-2 text-base font-semibold text-orange-deep">
                          countered at {formatPrice(o.counterAmount)}
                        </span>
                      )}
                    </p>
                    <span className="rounded-full bg-soft px-3 py-1 text-xs font-bold uppercase tracking-wide">
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-charcoal-soft">
                    From {o.status === "accepted" && seeker ? seeker.name : "a registered Quiet Seeker"}
                    {o.note ? `: “${o.note}”` : ""}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-charcoal-soft">
                    {o.history.map((h) => (
                      <li key={h.at}>
                        {formatDate(h.at)} · {h.event}
                      </li>
                    ))}
                  </ul>
                  {o.status === "submitted" && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
                      <form action={respondToOffer}>
                        <input type="hidden" name="offerId" value={o.id} />
                        <input type="hidden" name="action" value="accept" />
                        <SubmitButton
                          className="min-h-9 px-4 py-1.5"
                          pendingLabel="Accepting…"
                        >
                          Accept
                        </SubmitButton>
                      </form>
                      <form action={respondToOffer}>
                        <input type="hidden" name="offerId" value={o.id} />
                        <input type="hidden" name="action" value="decline" />
                        <SubmitButton
                          variant="secondary"
                          className="min-h-9 px-4 py-1.5"
                          pendingLabel="Declining…"
                        >
                          Decline
                        </SubmitButton>
                      </form>
                      <form
                        action={respondToOffer}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="offerId" value={o.id} />
                        <input type="hidden" name="action" value="counter" />
                        <input
                          type="number"
                          name="counterAmount"
                          placeholder="Counter (£)"
                          min={0}
                          step={1000}
                          className="min-h-9 w-36 rounded-full border border-hairline px-4 text-base"
                        />
                        <SubmitButton
                          variant="seller"
                          className="min-h-9 px-4 py-1.5"
                          pendingLabel="Countering…"
                        >
                          Counter
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {contractSigned && home.status !== "sold" && home.status !== "withdrawn" && (
        <p className="mt-10 rounded-2xl bg-soft p-4 text-xs text-charcoal-soft">
          Remember: your seller agreement commits this home to Matchlisted.
          Listing it with another agent on the open market counts as a
          withdrawal. There is no withdrawal fee; only your Home Report is
          ever payable.{" "}
          <Link href="/#fees" className="underline">
            Fee details
          </Link>
        </p>
      )}
    </Container>
  );
}
