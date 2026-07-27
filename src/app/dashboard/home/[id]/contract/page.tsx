import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/session";
import { getHome } from "@/lib/db";
import { signSellerContract } from "@/lib/actions";
import { CONTRACT_VERSIONS, HOME_REPORT_MARGIN, WITHDRAWAL_FEE } from "@/lib/site";

export const metadata: Metadata = { title: "Seller agreement" };

export default async function SellerContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const home = await getHome(id);
  if (!home || home.sellerId !== user.id) notFound();
  if (home.contract) redirect(`/dashboard/home/${home.id}`);
  const { error } = await searchParams;

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-orange-deep">
          {home.headline}
        </p>
        <h1 className="mt-2 text-3xl">The Hush Home seller agreement</h1>
        <p className="mt-2 text-charcoal-soft">
          Listing is free. This agreement is what keeps the quiet market
          quiet — and fair to the buyers who commit to it.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
            Please type your full name and tick the agreement box.
          </p>
        )}

        <div className="mt-8 max-h-96 overflow-y-auto rounded-2xl border border-hairline bg-soft p-6 text-sm leading-relaxed">
          <h2 className="text-base">
            Hush Home Seller Agreement — {CONTRACT_VERSIONS.seller}
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5">
            <li>
              <strong>Free listing.</strong> Matchlisted charges no listing fee
              and no percentage of your sale price. You build and own your
              listing content.
            </li>
            <li>
              <strong>Exclusive quiet sale.</strong> While this home is listed,
              you agree to sell it only to registered Quiet Seekers introduced
              through the Matchlisted platform.
            </li>
            <li>
              <strong>Withdrawal.</strong> Listing this home with another
              agent or on the open market (including portals) constitutes a
              withdrawal from Matchlisted and triggers a withdrawal fee of{" "}
              <strong>£{WITHDRAWAL_FEE} (+ VAT)</strong>, invoiced on
              withdrawal.
            </li>
            <li>
              <strong>Home Report.</strong> Your listing cannot go live until a
              Home Report has been purchased through Matchlisted from one of
              our trusted suppliers (currently Allied Surveyors Scotland and
              Graham + Sibbald; the price includes our £{HOME_REPORT_MARGIN}
              (+ VAT) arrangement margin), completed, uploaded and verified.
              The report is downloadable only by registered Quiet Seekers.
            </li>
            <li>
              <strong>Viewings & offers.</strong> You control your viewing
              diary. Offers arrive exclusively from registered, contract-signed
              Quiet Seekers with a solicitor already appointed.
            </li>
            <li>
              <strong>Signature.</strong> This agreement is executed
              electronically. Your typed name, the date, time and network
              address of signature are recorded and constitute your signature.
            </li>
          </ol>
        </div>

        <form action={signSellerContract} className="mt-6 space-y-4">
          <input type="hidden" name="homeId" value={home.id} />
          <div>
            <label htmlFor="typedName" className="block text-sm font-semibold">
              Type your full legal name to sign
            </label>
            <input
              id="typedName"
              name="typedName"
              required
              placeholder={user.name}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 font-display text-lg font-semibold outline-none focus:border-orange-deep"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="agree"
              required
              className="mt-0.5 h-4 w-4 accent-[var(--color-orange-deep)]"
            />
            <span>
              I have read the Hush Home Seller Agreement. I agree to sell only
              via Matchlisted while listed, and to the £{WITHDRAWAL_FEE} (+
              VAT) withdrawal fee if I list this home on the open market.
            </span>
          </label>
          <Button type="submit" variant="seller">
            Sign the seller agreement
          </Button>
        </form>
      </div>
    </Container>
  );
}
