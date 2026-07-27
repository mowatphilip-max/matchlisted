import type { Metadata } from "next";
import { FileCheck2, Heart, PenLine, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import {
  HushHomesBrowser,
  type BrowserHome,
} from "@/components/hush-homes/browser";
import { getBrief, liveHomes, previewHomes } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { HOME_REPORT_SUPPLIERS, WITHDRAWAL_FEE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hush Homes — browse quietly listed homes, list yours free",
  description:
    "Browse every quietly listed Hush Home in Scotland — anonymised until you register — and list your own for free. Verified Home Report, registered Quiet Seekers only.",
};

export const dynamic = "force-dynamic";

export default async function HushHomesPage() {
  const user = await currentUser();
  // Full details are for registered (contract-signed) Quiet Seekers + admin.
  const registered = Boolean(
    user && (user.isAdmin || await (await getBrief(user.id))?.contract),
  );

  // Ship each viewer ONLY the fields they may see — the gate is server-side,
  // not a CSS trick over complete data.
  const homes: BrowserHome[] = [
    ...(await liveHomes()).map(
      (h): BrowserHome => ({
        id: h.id,
        areaId: h.areaId,
        price: h.price,
        beds: h.beds,
        type: h.type,
        status: h.status === "under-offer" ? "under-offer" : "live",
        photo: h.photos[0] ?? null,
        ...(registered
          ? {
              headline: h.headline,
              baths: h.baths,
              garden: h.garden,
              reportReady: h.homeReport.status === "verified",
            }
          : {}),
      }),
    ),
    // Preview listings ("Home Report later"): story + hazed photos for all.
    ...(await previewHomes()).map(
      (h): BrowserHome => ({
        id: h.id,
        areaId: h.areaId,
        price: h.price,
        beds: h.beds,
        type: h.type,
        status: "preview",
        photo: h.photos[0] ?? null,
        headline: h.headline,
        description: h.description,
      }),
    ),
  ];

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
                body: `Buy it through Matchlisted from ${HOME_REPORT_SUPPLIERS.map((s) => s.name).join(", ")}. Fees are banded on your estimate of value; it verifies your home's worth, anchors your Match %, and is downloadable only by registered Quiet Seekers. Not ready yet? List as a preview — description and hazed photos — and do the report when you are.`,
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

      {/* The browsable list: every live Hush Home, gated by registration */}
      <section className="border-t border-hairline bg-soft py-16 sm:py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl">The Hush Homes, quietly waiting</h2>
              <p className="mt-3 max-w-2xl text-charcoal-soft">
                {registered
                  ? "You're a registered Quiet Seeker — full details on every home, and every verified Home Report is yours to download."
                  : "Anonymised on purpose. Register free as a Quiet Seeker to unlock every photo, headline and Home Report — and get your own Match % on each one."}
              </p>
            </div>
            {!registered && (
              <ButtonLink href="/join" variant="seeker">
                Register free to unlock
              </ButtonLink>
            )}
          </div>
          <div className="mt-8">
            <HushHomesBrowser homes={homes} registered={registered} />
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
