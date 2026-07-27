import type { Metadata } from "next";
import Link from "next/link";
import {
  allHomes,
  allInvoices,
  allOffers,
  allUsers,
  activeBriefs,
} from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — overview" };

export default async function AdminOverviewPage() {
  const homes = await allHomes();
  const invoices = await allInvoices();
  const offers = await allOffers();

  const live = homes.filter((h) => h.status === "live").length;
  const pendingReports = homes.filter(
    (h) => h.homeReport.status === "uploaded",
  ).length;
  const underOffer = homes.filter((h) => h.status === "under-offer").length;
  const sold = homes.filter((h) => h.status === "sold").length;
  const seekers = (await activeBriefs()).length;
  const users = (await allUsers()).length;

  const paidRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.net, 0);
  const dueRevenue = invoices
    .filter((i) => i.status === "due")
    .reduce((s, i) => s + i.net, 0);
  const concluded = offers.filter((o) => o.missivesConcludedAt).length;

  const tiles = [
    { label: "Live Hush Homes", value: live, href: "/admin/deals" },
    {
      label: "Reports to verify",
      value: pendingReports,
      href: "/admin/reports",
      alert: pendingReports > 0,
    },
    { label: "Active Quiet Seekers", value: seekers, href: "/admin/users" },
    { label: "Under offer", value: underOffer, href: "/admin/deals" },
    { label: "Missives concluded", value: concluded, href: "/admin/deals" },
    { label: "Sold", value: sold, href: "/admin/deals" },
    { label: "All users", value: users, href: "/admin/users" },
  ];

  return (
    <>
      <h1 className="text-3xl">The quiet engine room</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)] ring-1 transition-shadow hover:shadow-[var(--shadow-card-hover)] ${
              t.alert
                ? "bg-orange-tint ring-orange/40"
                : "bg-paper ring-hairline"
            }`}
          >
            <p className="font-display text-3xl font-bold">
              {t.value}
            </p>
            <p className="mt-1 text-sm text-charcoal-soft">{t.label}</p>
          </Link>
        ))}
        <Link
          href="/admin/invoices"
          className="rounded-[var(--radius-lg)] bg-charcoal-deep p-5 text-white shadow-[var(--shadow-card)]"
        >
          <p className="font-display text-3xl font-bold">
            {formatMoney(paidRevenue)}
          </p>
          <p className="mt-1 text-sm text-white/70">
            Net revenue collected · {formatMoney(dueRevenue)} invoiced &
            outstanding
          </p>
        </Link>
      </div>
    </>
  );
}
