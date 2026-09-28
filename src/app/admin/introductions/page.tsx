import type { Metadata } from "next";
import { Check, Heart, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  allIntroductions,
  getBrief,
  getHomeUnscoped,
  getUser,
  homesBySeller,
} from "@/lib/db";
import { adminOfferIntroduction } from "@/lib/actions";
import { areaLabel } from "@/lib/areas";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ADMIN_INTRO_MESSAGES, messageFor } from "@/lib/page-messages";

export const metadata: Metadata = { title: "Admin · Introductions" };

const STATUS_LABELS = {
  new: "Awaiting gate",
  offered: "Offered to seeker",
  accepted: "Accepted",
  declined: "Declined",
} as const;

function Gate({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5",
        ok ? "text-green-deep" : "text-charcoal-soft",
      )}
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {label}
    </li>
  );
}

export default async function AdminIntroductionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // `?error=gate` / `?error=prelive` — the introduction was refused, nothing sent.
  const { error } = await searchParams;
  const message = messageFor(ADMIN_INTRO_MESSAGES, error);
  const intros = await allIntroductions();
  // Resolve each row's related records before rendering — a server
  // component can't await inside the list below.
  const rows = await Promise.all(
    intros.map(async (intro) => {
      const homes = await homesBySeller(intro.sellerId);
      const home = intro.homeId ? await getHomeUnscoped(intro.homeId) : homes[0];
      return {
        intro,
        seeker: await getBrief(intro.seekerId),
        seekerUser: await getUser(intro.seekerId),
        seller: await getUser(intro.sellerId),
        home,
      };
    }),
  );

  return (
    <>
      <h1 className="text-3xl">Introductions</h1>
      <p className="mt-2 max-w-3xl text-charcoal-soft">
        Every &ldquo;they might want my home&rdquo; click lands here. The
        seeker is only offered the introduction when the gate is met: seller
        registered, home profile complete with a signed agreement, and the
        home <strong>live</strong> — a pre-live introduction is marketing
        without a Home Report (s.101), so queued hands fire automatically at
        go-live. Nobody&apos;s identity crosses the line until the seeker
        says yes.
      </p>

      {message && (
        <Alert tone={message.tone} title={message.title} className="mt-6">
          {message.body}
        </Alert>
      )}

      {intros.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Heart}
          title="No introduction requests yet"
          action={
            <ButtonLink href="/seekers" variant="secondary">
              See the live Quiet Seekers
            </ButtonLink>
          }
        >
          A request lands here the moment a Hush Home owner raises their hand
          for a Quiet Seeker.
        </EmptyState>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map(({ intro, seeker, seekerUser, seller, home }) => {
            const hasProfile = Boolean(home);
            const hasContract = Boolean(home?.contract);
            const reportVerified = home?.homeReport.status === "verified";
            const homeLive =
              !!home && ["live", "under-offer", "sold"].includes(home.status);
            // The legal gate: no introduction may be offered pre-live.
            const gateMet = hasProfile && hasContract && homeLive;

            return (
              <li
                key={intro.id}
                className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-bold">
                      <Heart className="h-4 w-4 fill-orange text-orange" />
                      {seller?.name ?? "Unknown seller"} →{" "}
                      {seeker?.publicRef ??
                        intro.seekerId.replace("mowatt:", "#")}{" "}
                      <span className="font-normal text-charcoal-soft">
                        {intro.seekerId.startsWith("mowatt:")
                          ? "(Mowatt sheet seeker, approach offline)"
                          : `(${seekerUser?.name})`}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-charcoal-soft">
                      Clicked {formatDate(intro.createdAt)}
                      {home && (
                        <>
                          {" "}
                          · home: {home.headline}, {areaLabel(home.areaId)},{" "}
                          {formatPrice(home.price)}
                        </>
                      )}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium">
                      <Gate ok label="Seller registered" />
                      <Gate ok={hasProfile} label="Home profile complete" />
                      <Gate ok={hasContract} label="Seller agreement signed" />
                      <Gate ok={reportVerified} label="Home Report verified" />
                      <Gate ok={homeLive} label="Home live" />
                    </ul>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                        intro.status === "accepted" &&
                          "bg-green-tint text-green-deep",
                        intro.status === "declined" && "bg-soft text-charcoal-soft",
                        intro.status === "offered" && "bg-blue-tint text-blue-text",
                        intro.status === "new" && "bg-orange-tint text-orange-deep",
                      )}
                    >
                      {STATUS_LABELS[intro.status]}
                    </span>
                    {intro.status === "new" && (
                      <form action={adminOfferIntroduction} className="mt-3">
                        <input type="hidden" name="introId" value={intro.id} />
                        {home && (
                          <input type="hidden" name="homeId" value={home.id} />
                        )}
                        <SubmitButton
                          disabled={!gateMet}
                          pendingLabel="Offering…"
                        >
                          Offer to seeker
                        </SubmitButton>
                        {!gateMet && (
                          <p className="mt-1.5 max-w-45 text-xs text-charcoal-soft">
                            {hasProfile && hasContract && !homeLive
                              ? "Queued. Fires automatically when the home goes live."
                              : "Gate not met yet. Chase the seller's profile first."}
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
