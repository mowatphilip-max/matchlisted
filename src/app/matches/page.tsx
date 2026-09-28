import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { HomeCard } from "@/components/home-card";
import { HeartButton } from "@/components/heart-button";
import { EmptyState } from "@/components/ui/empty-state";
import { currentUser } from "@/lib/session";
import { getBrief, savedForSeeker } from "@/lib/db";
import { matchesForSeeker } from "@/lib/matches";
import { matchLine } from "@/lib/match";
import { MATCHES_MESSAGES, messageFor } from "@/lib/page-messages";

export const metadata: Metadata = { title: "My matches" };

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  // `?error=slot-taken` — someone booked the viewing slot first.
  const { error } = await searchParams;
  const message = messageFor(MATCHES_MESSAGES, error);
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

      {message && (
        <Alert tone={message.tone} title={message.title} className="mt-6">
          {message.body}
        </Alert>
      )}

      {shortlist.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 fill-orange text-orange" /> My Matchlist
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
          <EmptyState
            className="mt-4"
            icon={Heart}
            title="Nothing live matches yet"
            action={
              <ButtonLink href="/dashboard/brief" variant="seeker">
                Widen my brief
              </ButtonLink>
            }
          >
            The Matchlist keeps watch and will tell you the moment that
            changes.
          </EmptyState>
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
