import type { Metadata } from "next";
import { FileCheck2, Heart, PenLine, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { HOME_REPORT_SUPPLIERS, WITHDRAWAL_FEE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sell a Hush Home — free listings, serious buyers",
  description:
    "List your home on Matchlisted for free. Verified Home Report, registered Quiet Seekers only, and a Match % that finds your buyer before a board ever goes up.",
};

export default function HushHomesPage() {
  return (
    <>
      <section className="bg-soft py-16 sm:py-20">
        <Container>
          <p className="text-sm font-bold uppercase tracking-wider text-orange-deep">
            For sellers
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">
            Your home&apos;s perfect match is already looking.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-charcoal-soft">
            A Hush Home sells without boards, portals or open viewings. You
            build the profile, we score it against every registered Quiet
            Seeker in Scotland, and you meet only the buyers who genuinely fit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/join?as=seller" variant="seller">
              Start your free listing
            </ButtonLink>
            <ButtonLink href="/#fees" variant="secondary">
              See the fees
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="text-3xl">Listing is free. Three conditions.</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: PenLine,
                title: "You build the profile",
                body: "Description, photography and floor plans are yours to create — our listing builder walks you through it. Your address stays private until a viewing is booked.",
              },
              {
                icon: FileCheck2,
                title: "A Home Report before going live",
                body: `Buy it through Matchlisted from ${HOME_REPORT_SUPPLIERS[0].name} or ${HOME_REPORT_SUPPLIERS[1].name}. It verifies your home's value, anchors your Match %, and is downloadable only by registered Quiet Seekers.`,
              },
              {
                icon: ShieldCheck,
                title: "One agreement, signed digitally",
                body: `You agree to sell only to registered Quiet Seekers through the platform. Listing with another agent on the open market counts as a withdrawal — a £${WITHDRAWAL_FEE} (+ VAT) fee applies.`,
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
              >
                <span className="inline-flex rounded-2xl bg-orange-tint p-3 text-orange-deep">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-charcoal-deep py-16 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-3 text-2xl text-white">
              <Heart className="h-6 w-6 fill-orange text-orange" />
              See who&apos;s matching before you commit.
            </h2>
            <p className="mt-2 max-w-xl text-white/70">
              Create the profile first — you&apos;ll see anonymised Quiet
              Seeker matches for your home before you order the Home Report.
            </p>
          </div>
          <ButtonLink href="/join?as=seller">List your Hush Home</ButtonLink>
        </Container>
      </section>
    </>
  );
}
