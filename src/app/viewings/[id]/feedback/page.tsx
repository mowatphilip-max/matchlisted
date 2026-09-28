import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SubmitButton } from "@/components/ui/submit-button";
import { currentUser } from "@/lib/session";
import { getHomeUnscoped, getViewing } from "@/lib/db";
import { submitViewingFeedback } from "@/lib/actions";
import { areaShortLabel } from "@/lib/areas";
import { formatTimeRange } from "@/lib/format";

export const metadata: Metadata = { title: "How was your viewing?" };

export default async function ViewingFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const viewing = await getViewing(id);
  if (!viewing || viewing.seekerId !== user.id) notFound();
  if (viewing.status === "completed") redirect("/dashboard");
  const home = await getHomeUnscoped(viewing.homeId);
  if (!home) notFound();

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-text">
          {home.headline} · {areaShortLabel(home.areaId)}
        </p>
        <h1 className="mt-2 text-3xl">How was your viewing?</h1>
        <p className="mt-2 text-charcoal-soft">
          {formatTimeRange(viewing.start, viewing.end)}. Your feedback goes
          straight to the seller (anonymised, as ever).
        </p>

        <form action={submitViewingFeedback} className="mt-8 space-y-6">
          <input type="hidden" name="viewingId" value={viewing.id} />
          <div>
            <label htmlFor="feedback" className="block text-sm font-semibold">
              Your impressions
            </label>
            <textarea
              id="feedback"
              name="feedback"
              rows={4}
              placeholder="What worked, what didn't. Honest is helpful."
              className="mt-1.5 w-full rounded-xl border border-hairline px-4 py-3 text-base focus:border-blue-deep"
            />
          </div>

          <div>
            <p className="text-sm font-semibold">Still interested?</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="cursor-pointer rounded-2xl border border-hairline p-4 text-center transition-colors has-[:checked]:border-green-deep has-[:checked]:bg-green-tint">
                <input
                  type="radio"
                  name="stillInterested"
                  value="yes"
                  required
                  className="sr-only"
                />
                <span className="block font-display text-lg font-bold">Yes</span>
                <span className="text-xs text-charcoal-soft">
                  Take me to the offer flow
                </span>
              </label>
              <label className="cursor-pointer rounded-2xl border border-hairline p-4 text-center transition-colors has-[:checked]:border-charcoal has-[:checked]:bg-soft">
                <input
                  type="radio"
                  name="stillInterested"
                  value="no"
                  className="sr-only"
                />
                <span className="block font-display text-lg font-bold">
                  Not this one
                </span>
                <span className="text-xs text-charcoal-soft">
                  Back to my matches
                </span>
              </label>
            </div>
          </div>

          <SubmitButton variant="seeker" pendingLabel="Sending feedback…">
            Send feedback
          </SubmitButton>
        </form>
      </div>
    </Container>
  );
}
