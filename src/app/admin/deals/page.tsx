import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
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
import { BUYER_FEE, withVat } from "@/lib/site";

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
        Viewings → offers → missives. Concluding missives raises the fixed £{BUYER_FEE} (+ VAT)
        sourcing fee automatically.
      </p>

      {/* Accepted offers awaiting missives */}
      <h2 className="mt-8 text-xl">With the lawyers</h2>
      <ul className="mt-4 space-y-4">
        {offers
          .filter((o) => o.status === "accepted" && !o.missivesConcludedAt)
          .map((o) => {
            const home = homes.find((h) => h.id === o.homeId);
            const buyer = users.get(o.seekerId);
            const lawyer = lawyers.get(o.lawyerId);
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
                    {formatPrice(o.amount)} from {buyer?.name} · {lawyer?.firm}{" "}
                    · accepted {formatDate(o.history.at(-1)?.at ?? o.createdAt)}
                  </p>
                  <p className="mt-1 text-sm">
                    Sourcing fee on conclusion:{" "}
                    <strong>£{BUYER_FEE} + VAT ({formatPrice(withVat(BUYER_FEE))})</strong>
                  </p>
                </div>
                <form action={adminConcludeMissives}>
                  <input type="hidden" name="offerId" value={o.id} />
                  <Button type="submit">Conclude missives & invoice</Button>
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
          <tbody className="divide-y divide-hairline">
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
                      <button className="cursor-pointer text-xs font-semibold text-red-deep underline">
                        Record withdrawal (£300 fee)
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
