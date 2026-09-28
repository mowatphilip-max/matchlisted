import type { Metadata } from "next";
import { Home } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  allHomes,
  allLawyers,
  allOffers,
  usersById,
  viewingsForHome,
} from "@/lib/db";
import { adminConcludeMissives, adminRecordWithdrawal } from "@/lib/actions";
import { areaShortLabel } from "@/lib/areas";
import { formatDate, formatPrice } from "@/lib/format";
import { CONFIG } from "@/lib/site";

export const metadata: Metadata = { title: "Admin · deals" };

export default async function AdminDealsPage() {
  const homes = await allHomes();
  const users = await usersById();
  const lawyers = new Map((await allLawyers()).map((l) => [l.id, l]));
  const offers = await allOffers();
  const viewingCounts = new Map(
    await Promise.all(
      homes.map(async (h) => [h.id, (await viewingsForHome(h.id)).length] as const),
    ),
  );

  return (
    <>
      <h1 className="text-3xl">Deals pipeline</h1>
      <p className="mt-2 text-charcoal-soft">
        Viewings → offers → missives. Concluding missives raises the fixed{" "}
        {formatPrice(CONFIG.fees.buyerFeeGross)} (inc VAT) buyer fee
        automatically.
      </p>

      {/* Accepted offers awaiting missives */}
      <h2 className="mt-8 text-xl">With the lawyers</h2>
      <ul className="mt-4 space-y-4">
        {offers
          .filter((o) => o.status === "accepted" && !o.missivesConcludedAt)
          .map((o) => {
            const home = homes.find((h) => h.id === o.homeId);
            const buyer = users.get(o.seekerId);
            const lawyer = o.lawyerId ? lawyers.get(o.lawyerId) : undefined;
            if (!home) return null;
            return (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
              >
                <div>
                  <p className="font-bold">
                    {home.headline}{" "}
                    <span className="font-normal text-charcoal-soft">
                      · {areaShortLabel(home.areaId)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-charcoal-soft">
                    {formatPrice(o.amount)} from {buyer?.name} ·{" "}
                    {lawyer?.firm ?? "no solicitor appointed yet"} · accepted{" "}
                    {formatDate(o.history.at(-1)?.at ?? o.createdAt)}
                  </p>
                  <p className="mt-1 text-sm">
                    Buyer fee on conclusion:{" "}
                    <strong>{formatPrice(CONFIG.fees.buyerFeeGross)} inc VAT</strong>
                  </p>
                </div>
                <form action={adminConcludeMissives}>
                  <input type="hidden" name="offerId" value={o.id} />
                  <SubmitButton pendingLabel="Concluding missives…">
                    Conclude missives & invoice
                  </SubmitButton>
                </form>
              </li>
            );
          })}
        {offers.filter((o) => o.status === "accepted" && !o.missivesConcludedAt)
          .length === 0 && (
          <li className="rounded-2xl bg-paper p-6 text-sm text-charcoal-soft ring-1 ring-hairline">
            No accepted offers awaiting missives.
          </li>
        )}
      </ul>

      {/* All listings */}
      <h2 className="mt-12 text-xl">All Hush Homes</h2>
      {homes.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Home}
          title="No Hush Homes listed yet"
          action={
            <ButtonLink href="/dashboard/home/new" variant="secondary">
              List the first Hush Home
            </ButtonLink>
          }
        >
          Every listing, live or draft, appears in this table as soon as a
          seller starts one.
        </EmptyState>
      ) : (
      <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs uppercase tracking-wider text-charcoal-soft">
              <th className="px-5 py-3 font-semibold">Home</th>
              <th className="px-5 py-3 font-semibold">Seller</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Viewings</th>
              <th className="px-5 py-3 font-semibold">Offers</th>
              <th className="px-5 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline [&>tr]:transition-colors [&>tr:hover]:bg-soft/60">
            {homes.map((h) => (
              <tr key={h.id}>
                <td className="px-5 py-3 font-medium">
                  {h.headline}
                  <span className="block text-xs text-charcoal-soft">
                    {areaShortLabel(h.areaId)}
                  </span>
                </td>
                <td className="px-5 py-3">{users.get(h.sellerId)?.name}</td>
                <td className="px-5 py-3">{formatPrice(h.price)}</td>
                <td className="px-5 py-3 capitalize">{h.status.replace("-", " ")}</td>
                <td className="px-5 py-3">{viewingCounts.get(h.id) ?? 0}</td>
                <td className="px-5 py-3">
                  {offers.filter((o) => o.homeId === h.id).length}
                </td>
                <td className="px-5 py-3">
                  {(h.status === "live" || h.status === "under-offer") && (
                    <form action={adminRecordWithdrawal}>
                      <input type="hidden" name="homeId" value={h.id} />
                      {/* Writes ledger entries and invoices, and there is no
                          undo — so it arms before it commits, and it is a
                          button now rather than a 16px underlined text run at
                          the end of a scrolling table row. */}
                      <ConfirmSubmit
                        variant="secondary"
                        size="sm"
                        className="text-red-deep ring-red-deep/40 hover:bg-red-tint hover:ring-red-deep"
                        confirmLabel="Yes, record it"
                        pendingLabel="Recording…"
                      >
                        Record withdrawal
                      </ConfirmSubmit>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}
