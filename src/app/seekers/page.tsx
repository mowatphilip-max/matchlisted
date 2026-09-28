import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SeekersBrowser } from "@/components/seekers/seekers-browser";
import { fetchMowattSeekers } from "@/lib/mowatt-seekers";

export const metadata: Metadata = {
  title: "Live Quiet Seekers: real buyers, quietly looking",
  description:
    "Browse every live Quiet Seeker on the Matchlist: real registered buyers with real budgets and profiles, anonymised until there's a match.",
};

// Live data from the shared Mowatt sheets — always render fresh.
export const dynamic = "force-dynamic";

export default async function SeekersDirectoryPage() {
  const { seekers, failedRegions } = await fetchMowattSeekers();
  const active = seekers.filter((s) => s.active);

  return (
    <>
      <section className="bg-soft py-16 sm:py-20">
        <Container>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-text">
            Live now
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">
            {active.length} Quiet Seekers, quietly looking.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-charcoal-soft">
            Every profile below is a real, registered buyer: anonymised, but
            genuinely in the market across East Lothian and Edinburgh.
            Recognise your home in one of these profiles? They can&apos;t be
            contacted directly, but they can be <strong>matched</strong>: list
            your home as a Hush Home and we&apos;ll handle the introduction.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-tint px-4 py-1.5 text-sm font-medium text-blue-text">
            <ShieldCheck className="h-4 w-4" />
            Identities are never shown. Introductions only happen through the
            Matchlist
          </p>
          {failedRegions.length > 0 && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-tint px-4 py-2.5 text-sm font-medium text-red-deep">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              The {failedRegions.join(" and ")} list couldn&apos;t be loaded
              just now, so we&apos;re showing the rest. Refresh in a minute.
            </p>
          )}
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <SeekersBrowser seekers={seekers} />
        </Container>
      </section>

      <section className="bg-charcoal-deep py-16 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl text-white">
              One of them is looking for your home.
            </h2>
            <p className="mt-2 max-w-xl text-white/70">
              No listing fee, no commission, and fully private: no boards, no portals. Your home
              is only ever shown to seekers who fit, and only when you say so.
            </p>
          </div>
          <ButtonLink href="/join?as=seller">List your Hush Home</ButtonLink>
        </Container>
      </section>
    </>
  );
}
