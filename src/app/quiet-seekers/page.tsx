import type { Metadata } from "next";
import { FileText, Heart, MapPinned, Percent } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { CONFIG } from "@/lib/site";

export const metadata: Metadata = {
  title: "Become a Quiet Seeker: homes that match, before the market",
  description:
    "Register free, build your brief, and get a Match % on every Hush Home in Scotland. Pay only a fixed £360 buyer fee (including VAT) when you actually buy.",
};

export default function QuietSeekersPage() {
  return (
    <>
      <section className="bg-soft py-16 sm:py-20">
        <Container>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-text">
            For buyers
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">
            Stop scrolling portals. Start getting matched.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-charcoal-soft">
            Tell us where in Scotland, what budget, how many bedrooms and what
            actually matters. The Matchlist rates every Hush Home against
            your brief and tells you when it finds the one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/join">Build your brief, free</ButtonLink>
            <ButtonLink href="/seekers" variant="seeker">
              See the live Quiet Seekers
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="text-3xl">What registering gets you</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: MapPinned,
                title: "A brief, not a search box",
                body: "Pick your areas anywhere in Scotland, set a budget range from £50,000 to £5 million on one slider, and state your position: cash, sold, or still to sell.",
              },
              {
                icon: Percent,
                title: "A Match % on every home",
                body: "Every live Hush Home is scored against your brief. 90%+ and you'll hear about it the moment it happens. “It's a match” works both ways.",
              },
              {
                icon: FileText,
                title: "The keys to the quiet market",
                body: "Only registered Quiet Seekers can download Home Reports, book viewings from the seller's diary, and make offers. No solicitor needed to offer, nothing to pay.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
              >
                <span className="inline-flex rounded-2xl bg-blue-tint p-3 text-blue-deep">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[var(--radius-lg)] bg-soft p-6 sm:p-8">
            <h3 className="text-xl">The only fee, in plain words</h3>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-charcoal-soft">
              Registration is free. When you sign up you agree to one thing: if
              you buy a property you found through Matchlisted, a{" "}
              <strong className="text-charcoal">
                fixed {formatPrice(CONFIG.fees.buyerFeeGross)} buyer fee
                (including VAT)
              </strong>{" "}
              is payable on conclusion of missives, whether the home costs
              £150,000 or £1.5 million. The fee still applies if you buy the same property later, even
              after it has left the site. You don&apos;t need a solicitor to
              make an offer, and nothing is payable to submit one. If your
              offer is accepted, you appoint a solicitor then, your own or one
              from our panel.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-charcoal-deep py-16 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <h2 className="flex items-center gap-3 text-2xl text-white">
            <Heart className="h-6 w-6 fill-orange text-orange" />
            87% match. This could be the one.
          </h2>
          <ButtonLink href="/join">Become a Quiet Seeker</ButtonLink>
        </Container>
      </section>
    </>
  );
}
