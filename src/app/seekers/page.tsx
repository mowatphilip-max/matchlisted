import type { Metadata } from "next";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SeekerCard } from "@/components/seeker-card";
import { toBriefLike } from "@/lib/mowatt-bridge";
import { fetchMowattSeekers } from "@/lib/mowatt-seekers";

export const metadata: Metadata = {
  title: "Live Quiet Seekers — real buyers, quietly looking",
  description:
    "Browse every live Quiet Seeker on the Matchlist: real registered buyers with real budgets and briefs — anonymised until there's a match.",
};

// Live data from the shared Mowatt sheets — always render fresh.
export const dynamic = "force-dynamic";

export default async function SeekersDirectoryPage() {
  const { seekers, failedRegions } = await fetchMowattSeekers();
  const active = seekers.filter((s) => s.active);
  const matched = seekers.filter((s) => !s.active);

  return (
    <>
      <section className="bg-soft py-16 sm:py-20">
        <Container>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-deep">
            Live now
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">
            {active.length} Quiet Seekers, quietly looking.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-charcoal-soft">
            Every profile below is a real, registered buyer — anonymised, but
            genuinely in the market across East Lothian and Edinburgh.
            Recognise your home in one of these briefs? They can&apos;t be
            contacted directly, but they can be <strong>matched</strong>: list
            your home as a Hush Home and we&apos;ll handle the introduction.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-tint px-4 py-1.5 text-sm font-medium text-blue-deep">
            <ShieldCheck className="h-4 w-4" />
            Identities are never shown — introductions only happen through the
            Matchlist
          </p>
          {failedRegions.length > 0 && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-tint px-4 py-2.5 text-sm font-medium text-red-deep">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              The {failedRegions.join(" and ")} list couldn&apos;t be loaded
              just now — showing the rest. Refresh in a minute.
            </p>
          )}
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((s) => (
              <SeekerCard key={s.ref} brief={toBriefLike(s)} />
            ))}
          </div>

          {matched.length > 0 && (
            <>
              <h2 className="mt-14 text-2xl">
                {matched.length} recently matched
              </h2>
              <p className="mt-1 text-sm text-charcoal-soft">
                These buyers found their home through the Matchlist — proof
                the quiet route works.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {matched.map((s) => (
                  <div key={s.ref} className="relative">
                    <div className="pointer-events-none select-none opacity-55 grayscale-[0.4]">
                      <SeekerCard brief={toBriefLike(s)} />
                    </div>
                    <span className="absolute left-1/2 top-4 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-charcoal/85 px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
                      This buyer has found their home
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Container>
      </section>

      <section className="bg-charcoal-deep py-16 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl text-white">
              One of them is looking for your home.
            </h2>
            <p className="mt-2 max-w-xl text-white/70">
              Listing is free and private — no boards, no portals. Your home
              is only ever shown to seekers who fit, and only when you say so.
            </p>
          </div>
          <ButtonLink href="/join?as=seller">List your Hush Home — free</ButtonLink>
        </Container>
      </section>
    </>
  );
}
