import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminUpdatePurchaseOrder } from "@/lib/actions";
import { allPurchaseOrders, homesById, usersById } from "@/lib/db";
import { areaLabel } from "@/lib/areas";
import { formatDate, formatMoney } from "@/lib/format";
import { HOME_REPORT_SUPPLIERS } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Purchase orders" };

const STATUS = {
  instructed: { label: "Instructed · awaiting their invoice", cls: "bg-blue-tint text-blue-deep" },
  billed: { label: "Their invoice received", cls: "bg-orange-tint text-orange-deep" },
  settled: { label: "Settled · surveyor paid", cls: "bg-green-tint text-green-deep" },
} as const;

export default async function AdminOrdersPage() {
  const orders = await allPurchaseOrders();
  const users = await usersById();
  const homes = await homesById();
  const owedTotal = orders
    .filter((o) => o.status !== "settled")
    .reduce((sum, o) => sum + o.base + o.vat, 0);

  return (
    <>
      <h1 className="text-3xl">Purchase orders</h1>
      <p className="mt-2 max-w-3xl text-charcoal-soft">
        One PO per paid Home Report. The owner has already paid us; the
        surveyor bills us against the PO number, and we settle it. Currently
        outstanding to surveyors:{" "}
        <strong className="text-charcoal">{formatMoney(owedTotal)}</strong>{" "}
        (inc. VAT).
      </p>

      {orders.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-paper p-6 text-sm text-charcoal-soft ring-1 ring-hairline">
          No purchase orders yet. They appear the moment an owner pays for a
          Home Report.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((po) => {
            const home = homes.get(po.homeId);
            const owner = users.get(po.sellerId);
            const supplier = HOME_REPORT_SUPPLIERS.find((s) => s.id === po.supplier);
            const st = STATUS[po.status];
            return (
              <li
                key={po.id}
                className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-bold">
                      <FileText className="h-4 w-4 text-orange-deep" />
                      {po.id} · {supplier?.name}
                    </p>
                    <p className="mt-1 text-sm text-charcoal-soft">
                      {home ? `${home.addressLine}, ${areaLabel(home.areaId)}` : po.homeId} ·
                      owner {owner?.name} ({owner?.phone ?? "no phone"}) ·
                      raised {formatDate(po.createdAt)}
                    </p>
                    <p className="mt-2 text-sm">
                      Owner paid <strong>{formatMoney(po.total)}</strong>{" "}
                      <span className="text-charcoal-soft">
                        ({formatMoney(po.base)} fee + {formatMoney(po.vat)} VAT +{" "}
                        {formatMoney(po.margin)} our fee) · we owe the surveyor{" "}
                        {formatMoney(po.base + po.vat)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-semibold", st.cls)}>
                      {st.label}
                    </span>
                    {po.status !== "settled" && (
                      <form action={adminUpdatePurchaseOrder} className="mt-3">
                        <input type="hidden" name="poId" value={po.id} />
                        <input
                          type="hidden"
                          name="action"
                          value={po.status === "instructed" ? "billed" : "settled"}
                        />
                        <Button type="submit" variant="secondary" className="min-h-9 px-4 py-1.5">
                          {po.status === "instructed"
                            ? "Their invoice arrived"
                            : `Mark paid (${formatMoney(po.base + po.vat)})`}
                        </Button>
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
