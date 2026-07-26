import type { Metadata } from "next";
import { getBrief, homesBySeller, invoicesForUser, store } from "@/lib/db";
import { areaShortLabel } from "@/lib/areas";
import { formatBudget, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — users" };

export default function AdminUsersPage() {
  const users = store().users;

  return (
    <>
      <h1 className="text-3xl">Users</h1>
      <p className="mt-2 text-charcoal-soft">
        Every account, both sides of it. Sellers see seekers anonymised — you
        don&apos;t.
      </p>
      <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs uppercase tracking-wider text-charcoal-soft">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3 font-semibold">Seeker brief</th>
              <th className="px-5 py-3 font-semibold">Hush Homes</th>
              <th className="px-5 py-3 font-semibold">Fees due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {users.map((u) => {
              const brief = getBrief(u.id);
              const homes = homesBySeller(u.id);
              const due = invoicesForUser(u.id).filter(
                (i) => i.status === "due",
              );
              return (
                <tr key={u.id}>
                  <td className="px-5 py-3 font-medium">
                    {u.name}
                    {u.isAdmin && (
                      <span className="ml-2 rounded-full bg-charcoal px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-charcoal-soft">{u.email}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    {brief ? (
                      <span>
                        {brief.areas.slice(0, 2).map(areaShortLabel).join(", ")}
                        {brief.areas.length > 2 ? "…" : ""} ·{" "}
                        {formatBudget(brief.budgetMin, brief.budgetMax)}
                        {!brief.contract && (
                          <span className="ml-1 text-xs font-semibold text-red-deep">
                            (unsigned)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-charcoal-soft">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {homes.length ? (
                      homes.map((h) => (
                        <span key={h.id} className="block">
                          {areaShortLabel(h.areaId)}{" "}
                          <span className="text-xs capitalize text-charcoal-soft">
                            ({h.status.replace("-", " ")})
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="text-charcoal-soft">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {due.length ? (
                      <span className="font-semibold text-orange-deep">
                        {due.length}
                      </span>
                    ) : (
                      <span className="text-charcoal-soft">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
