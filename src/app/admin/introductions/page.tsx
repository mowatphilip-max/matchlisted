import type { Metadata } from "next";
import { Check, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  allIntroductions,
  getBrief,
  getHome,
  getUser,
  homesBySeller,
} from "@/lib/db";
import { adminOfferIntroduction } from "@/lib/actions";
import { areaLabel } from "@/lib/areas";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Introductions" };

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

export default function AdminIntroductionsPage() {
  const intros = allIntroductions();

  return (
    <>
      <h1 className="text-3xl">Introductions</h1>
      <p className="mt-2 max-w-3xl text-charcoal-soft">
        Every &ldquo;they might want my home&rdquo; click lands here. The
        seeker is only offered the introduction when the gate is met: seller
        registered, home profile complete with a signed agreement — and
        ideally a verified Home Report. Nobody&apos;s identity crosses the
        line until the seeker says yes.
      </p>

      {intros.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-paper p-6 text-sm text-charcoal-soft ring-1 ring-hairline">
          No introduction requests yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {intros.map((intro) => {
            const seeker = getBrief(intro.seekerId);
            const seekerUser = getUser(intro.seekerId);
            const seller = getUser(intro.sellerId);
            const homes = homesBySeller(intro.sellerId);
            const home = intro.homeId ? getHome(intro.homeId) : homes[0];
            const hasProfile = Boolean(home);
            const hasContract = Boolean(home?.contract);
            const reportVerified = home?.homeReport.status === "verified";
            const gateMet = hasProfile && hasContract;

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
                          ? "(Mowatt sheet seeker — approach offline)"
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
                    </ul>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                        intro.status === "accepted" &&
                          "bg-green-tint text-green-deep",
                        intro.status === "declined" && "bg-soft text-charcoal-soft",
                        intro.status === "offered" && "bg-blue-tint text-blue-deep",
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
                        <Button type="submit" disabled={!gateMet}>
                          Offer to seeker
                        </Button>
                        {!gateMet && (
                          <p className="mt-1.5 max-w-45 text-xs text-charcoal-soft">
                            Gate not met yet — chase the seller&apos;s profile
                            first.
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
