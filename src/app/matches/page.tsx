import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {  } from "lucide-react";
import { BrandHeart } from "@/components/brand-heart";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { HomeCard } from "@/components/home-card";
import { HeartButton } from "@/components/heart-button";
import { currentUser } from "@/lib/session";
import { getBrief, savedForSeeker } from "@/lib/db";
import { matchesForSeeker } from "@/lib/matches";
import { matchLine } from "@/lib/match";

export const metadata: Metadata = { title: "My matches" };

export default async function MatchesPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const brief = await getBrief(user.id);
  if (!brief) redirect("/dashboard/brief");
  if (!brief.contract) redirect("/dashboard/brief/contract");

  const matches = await matchesForSeeker(user.id);
  const saved = new Set((await savedForSeeker(user.id)).map((s) => s.homeId));
  const shortlist = matches.filter((m) => saved.has(m.home.id));

  return (
    <Container className="py-10">
      <h1 className="text-3xl">Your matches</h1>
      <p className="mt-1 text-charcoal-soft">
        Every live Hush Home in Scotland, scored against your brief. Tap the
        heart to shortlist.
      </p>

      {shortlist.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl">
            <BrandHeart className="h-5 w-5 text-orange" /> My Matchlist
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shortlist.map((m) => (
              <HomeCard
                key={m.home.id}
                home={m.home}
                pct={m.result.pct}
                matchDetail={matchLine(m.result.pct)}
                href={`/homes/${m.home.id}`}
                heartSlot={<HeartButton homeId={m.home.id} saved />}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl">All matches</h2>
        {matches.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-soft p-6">
            <p className="text-sm text-charcoal-soft">
              Nothing live matches yet. The Matchlist keeps watch and will
              tell you the moment that changes.
            </p>
            <ButtonLink href="/dashboard/brief" variant="seeker" className="mt-4">
              Widen my brief
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <HomeCard
                key={m.home.id}
                home={m.home}
                pct={m.result.pct}
                matchDetail={m.result.gated ?? matchLine(m.result.pct)}
                href={`/homes/${m.home.id}`}
                heartSlot={
                  <HeartButton homeId={m.home.id} saved={saved.has(m.home.id)} />
                }
              />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
