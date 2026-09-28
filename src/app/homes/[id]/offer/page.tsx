import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Container } from "@/components/ui/container";
import { SubmitButton } from "@/components/ui/submit-button";
import { currentUser } from "@/lib/session";
import { getBrief, getHomeFor, getOffer } from "@/lib/db";
import { acceptCounter, submitOffer } from "@/lib/actions";
import { areaShortLabel } from "@/lib/areas";
import { formatPrice } from "@/lib/format";
import { CONFIG } from "@/lib/site";
import { OFFER_MESSAGES, messageFor } from "@/lib/page-messages";

export const metadata: Metadata = { title: "Make an offer" };

export default async function OfferPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ counter?: string; deposit?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  // `?deposit=paid` comes back from the conveyancing-deposit checkout.
  const { counter, deposit } = await searchParams;
  const message = messageFor(OFFER_MESSAGES, deposit);
  // §3 scope: an offer page for a home the viewer may not see is a leak.
  const home = await getHomeFor(id, user);
  if (!home) notFound();
  const brief = await getBrief(user.id);
  if (!brief?.contract) redirect("/dashboard/brief");

  const counterOffer = counter ? await getOffer(counter) : undefined;

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

        {message && (
          <Alert tone={message.tone} title={message.title} className="mt-6">
            {message.body}
          </Alert>
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
                <SubmitButton pendingLabel="Accepting the counter…">
                  Accept counter of{" "}
                  {formatPrice(counterOffer.counterAmount ?? 0)}
                </SubmitButton>
              </form>
              <p className="mt-3 text-xs text-charcoal-soft">
                Or submit a fresh offer below. It replaces this negotiation.
              </p>
            </div>
          )}

        {/* The offer. No solicitor, no payment, no conditions — conditioning
            offer submission on services is an undesirable practice under the
            1991 Order (DECISIONS.md §0.5). */}
        <form
          action={submitOffer}
          className="mt-6 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
        >
          <input type="hidden" name="homeId" value={home.id} />
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
            className="mt-1.5 min-h-12 w-full rounded-xl border border-hairline px-4 font-display text-xl font-bold focus:border-orange-deep"
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
            className="mt-1.5 w-full rounded-xl border border-hairline px-4 py-3 text-base focus:border-orange-deep"
          />
          <p className="mt-4 rounded-xl bg-soft p-4 text-xs text-charcoal-soft">
            You don&apos;t need a solicitor to make an offer, and nothing is
            payable to submit one. If your offer is accepted, you appoint a
            solicitor then, your own or one from our panel, to conclude the
            missives.
          </p>
          <p className="mt-3 rounded-xl bg-soft p-4 text-xs text-charcoal-soft">
            Reminder from your Quiet Seeker agreement: on conclusion of
            missives the fixed {formatPrice(CONFIG.fees.buyerFeeGross)} buyer
            fee applies (including VAT), whatever the price.
          </p>
          <SubmitButton className="mt-4 w-full" pendingLabel="Sending your offer…">
            Send my offer to the seller
          </SubmitButton>
        </form>
      </div>
    </Container>
  );
}
