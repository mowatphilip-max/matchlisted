import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/session";
import { getBrief } from "@/lib/db";
import { signSeekerContract } from "@/lib/actions";
import { formatPrice } from "@/lib/format";
import { CONTRACT_VERSIONS, sourcingFee } from "@/lib/site";

export const metadata: Metadata = { title: "Quiet Seeker agreement" };

export default async function SeekerContractPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const brief = getBrief(user.id);
  if (!brief) redirect("/dashboard/brief");
  if (brief.contract) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-deep">
          One last step
        </p>
        <h1 className="mt-2 text-3xl">The Quiet Seeker agreement</h1>
        <p className="mt-2 text-charcoal-soft">
          Registration stays free. This agreement is what lets sellers trust
          that every Introduction is a serious one.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
            Please type your full name and tick the agreement box.
          </p>
        )}

        <div className="mt-8 max-h-96 overflow-y-auto rounded-2xl border border-hairline bg-soft p-6 text-sm leading-relaxed">
          <h2 className="text-base">
            Quiet Seeker Agreement — {CONTRACT_VERSIONS.seeker}
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5">
            <li>
              <strong>Registration is free.</strong> No charge to register as
              a Quiet Seeker, build a brief, receive matches, download Home
              Reports or book viewings.
            </li>
            <li>
              <strong>Sourcing fee.</strong> If you successfully purchase a
              property found through Matchlisted, a sourcing fee of{" "}
              <strong>0.8% of the purchase price (+ VAT)</strong> is payable to
              Matchlisted on conclusion of missives. Worked example: a{" "}
              {formatPrice(200000)} purchase means a fee of{" "}
              {formatPrice(sourcingFee(200000))} (+ VAT).
            </li>
            <li>
              <strong>The fee survives the listing.</strong> The sourcing fee
              remains payable if you purchase a property first introduced to
              you through Matchlisted at a later date, including after the
              property has left the site.
            </li>
            <li>
              <strong>Conveyancing deposit.</strong> Before submitting an
              offer you must appoint a solicitor from the Matchlisted panel,
              secured by a £100 (+ VAT) conveyancing deposit.
            </li>
            <li>
              <strong>Fair use.</strong> Home Reports and property details are
              provided for your own purchase decision only and may not be
              shared outside your household or advisers.
            </li>
            <li>
              <strong>Signature.</strong> This agreement is executed
              electronically. Your typed name, the date, time and network
              address of signature are recorded and constitute your signature.
            </li>
          </ol>
        </div>

        <form action={signSeekerContract} className="mt-6 space-y-4">
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
              I have read the Quiet Seeker Agreement and I agree to the 0.8%
              (+ VAT) sourcing fee, including after a property leaves the site.
            </span>
          </label>
          <Button type="submit">Sign & start matching</Button>
        </form>
      </div>
    </Container>
  );
}
