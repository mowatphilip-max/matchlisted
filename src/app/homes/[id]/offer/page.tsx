import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Scale, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/session";
import {
  allLawyers,
  getBrief,
  getHome,
  getLawyer,
  getOffer,
  invoicesForUser,
} from "@/lib/db";
import { acceptCounter, appointLawyer, submitOffer } from "@/lib/actions";
import { areaShortLabel } from "@/lib/areas";
import { formatMoney, formatPrice } from "@/lib/format";
import { CONVEYANCING_DEPOSIT, sourcingFee, withVat } from "@/lib/site";

export const metadata: Metadata = { title: "Make an offer" };

export default async function OfferPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ counter?: string; error?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const { counter, error } = await searchParams;
  const home = await getHome(id);
  if (!home) notFound();
  const brief = await getBrief(user.id);
  if (!brief?.contract) redirect("/dashboard/brief");

  const counterOffer = counter ? await getOffer(counter) : undefined;
  const paidDeposit = (await invoicesForUser(user.id)).find(
    (i) =>
      i.kind === "conveyancing-deposit" &&
      i.homeId === home.id &&
      i.status === "paid",
  );
  const appointedLawyer = paidDeposit?.lawyerId
    ? await getLawyer(paidDeposit.lawyerId)
    : undefined;

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-orange-deep">
          {home.headline} · {areaShortLabel(home.areaId)} ·{" "}
          {formatPrice(home.price)}
        </p>
        <h1 className="mt-2 text-3xl">
          {counterOffer ? "The seller has countered" : "Make your offer"}
        </h1>

        {error === "deposit" && (
          <p className="mt-4 rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
            Appoint your lawyer (and pay the deposit) before submitting an
            offer.
          </p>
        )}

        {/* Counter response */}
        {counterOffer &&
          counterOffer.seekerId === user.id &&
          counterOffer.status === "countered" && (
            <div className="mt-6 rounded-[var(--radius-lg)] bg-orange-tint p-6">
              <p className="text-sm">
                Your offer of{" "}
                <strong>{formatPrice(counterOffer.amount)}</strong> was
                countered at{" "}
                <strong className="text-orange-deep">
                  {formatPrice(counterOffer.counterAmount ?? 0)}
                </strong>
                .
              </p>
              <form action={acceptCounter} className="mt-4">
                <input type="hidden" name="offerId" value={counterOffer.id} />
                <Button type="submit">
                  Accept counter of{" "}
                  {formatPrice(counterOffer.counterAmount ?? 0)}
                </Button>
              </form>
              <p className="mt-3 text-xs text-charcoal-soft">
                Or submit a fresh offer below — it replaces this negotiation.
              </p>
            </div>
          )}

        {/* Step 1: lawyer */}
        {!appointedLawyer ? (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-xl">
              <Scale className="h-5 w-5 text-blue-deep" /> First, appoint your
              lawyer
            </h2>
            <p className="mt-2 text-sm text-charcoal-soft">
              An offer with a solicitor behind it is an offer sellers take
              seriously. Choose from the Matchlisted panel — appointing costs a{" "}
              {formatMoney(withVat(CONVEYANCING_DEPOSIT))} deposit (inc. VAT),
              credited against their fee.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(await allLawyers()).map((l) => (
                <form
                  key={l.id}
                  action={appointLawyer}
                  className="flex flex-col rounded-[var(--radius-lg)] bg-paper p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline"
                >
                  <input type="hidden" name="homeId" value={home.id} />
                  <input type="hidden" name="lawyerId" value={l.id} />
                  <p className="font-bold">{l.firm}</p>
                  <p className="text-xs text-charcoal-soft">
                    {l.contactName} · {l.location}
                  </p>
                  <p className="mt-2 flex-1 text-sm text-charcoal-soft">
                    {l.blurb}
                  </p>
                  <p className="mt-3 font-display text-lg font-bold">
                    ~{formatPrice(l.feeEstimate)}
                    <span className="text-xs font-normal text-charcoal-soft">
                      {" "}
                      + VAT & outlays
                    </span>
                  </p>
                  <Button
                    type="submit"
                    variant="seeker"
                    className="mt-3 min-h-9 px-4 py-1.5"
                  >
                    Appoint & pay deposit
                  </Button>
                </form>
              ))}
            </div>
          </div>
        ) : (
          <>
            <p className="mt-6 flex items-center gap-2 rounded-2xl bg-green-tint p-4 text-sm text-green-deep">
              <ShieldCheck className="h-5 w-5" />
              <span>
                <strong>{appointedLawyer.firm}</strong> appointed — deposit
                paid. An accepted offer goes straight to them to conclude the
                sale.
              </span>
            </p>

            {/* Step 2: the offer */}
            <form
              action={submitOffer}
              className="mt-6 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
            >
              <input type="hidden" name="homeId" value={home.id} />
              <input type="hidden" name="lawyerId" value={appointedLawyer.id} />
              <label htmlFor="amount" className="block text-sm font-semibold">
                Your offer (£)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                required
                min={50000}
                step={500}
                defaultValue={counterOffer?.counterAmount ?? home.price}
                className="mt-1.5 min-h-12 w-full rounded-xl border border-hairline px-4 font-display text-xl font-bold outline-none focus:border-orange-deep"
              />
              <label htmlFor="note" className="mt-4 block text-sm font-semibold">
                A note for the seller{" "}
                <span className="font-normal text-charcoal-soft">(optional)</span>
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                placeholder="Entry dates, conditions, or just why you love it."
                className="mt-1.5 w-full rounded-xl border border-hairline px-4 py-3 text-sm outline-none focus:border-orange-deep"
              />
              <p className="mt-4 rounded-xl bg-soft p-4 text-xs text-charcoal-soft">
                Reminder from your Quiet Seeker agreement: on conclusion of
                missives the 0.8% (+ VAT) sourcing fee applies — at{" "}
                {formatPrice(home.price)} that&apos;s{" "}
                {formatPrice(sourcingFee(home.price))} (+ VAT).
              </p>
              <Button type="submit" className="mt-4 w-full">
                Send my offer to the seller
              </Button>
            </form>
          </>
        )}
      </div>
    </Container>
  );
}
