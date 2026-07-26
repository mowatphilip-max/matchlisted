import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SeekerCard } from "@/components/seeker-card";
import { activeBriefs } from "@/lib/db";

export const metadata: Metadata = {
  title: "Live Quiet Seekers — real buyers, quietly looking",
  description:
    "Browse every live Quiet Seeker on the Matchlist: verified buyers with signed agreements, real budgets and real briefs — anonymised until there's a match.",
};

// Profiles come and go as briefs are signed; always render fresh.
export const dynamic = "force-dynamic";

export default function SeekersDirectoryPage() {
  const briefs = activeBriefs().sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <>
      <section className="bg-soft py-16 sm:py-20">
        <Container>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-deep">
            Live now
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">
            {briefs.length} Quiet Seekers, quietly looking.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-charcoal-soft">
            Every profile below is a real, registered buyer with a signed
            agreement — anonymised, but genuinely in the market. Recognise
            your home in one of these briefs? They can&apos;t be contacted
            directly, but they can be <strong>matched</strong>: list your home
            as a Hush Home and we&apos;ll handle the introduction.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-tint px-4 py-1.5 text-sm font-medium text-blue-deep">
            <ShieldCheck className="h-4 w-4" />
            Identities are never shown — introductions only happen through
            Matchlisted
          </p>
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {briefs.map((b) => (
              <SeekerCard key={b.publicRef} brief={b} />
            ))}
          </div>
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
