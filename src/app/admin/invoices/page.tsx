import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { allInvoices, usersById } from "@/lib/db";
import { adminMarkInvoicePaid } from "@/lib/actions";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · invoices" };

const kindLabels: Record<string, string> = {
  "home-report": "Home Report",
  "conveyancing-deposit": "Conveyancing deposit",
  "sourcing-fee": "Buyer fee (£300 fixed)",
  "withdrawal-fee": "Withdrawal fee",
};

export default async function AdminInvoicesPage() {
  const users = await usersById();
  const invoices = [...(await allInvoices())].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const due = invoices.filter((i) => i.status === "due");
  const totalDue = due.reduce((s, i) => s + i.net + i.vat, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl">Invoices & fees</h1>
        <p className="text-sm text-charcoal-soft">
          {due.length} outstanding · {formatMoney(totalDue)} inc. VAT
        </p>
      </div>
      <p className="mt-2 text-charcoal-soft">
        Home Reports and deposits collect by card at checkout; sourcing and
        withdrawal fees are invoiced and marked paid here on receipt.
      </p>

      <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-hairline">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs uppercase tracking-wider text-charcoal-soft">
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Description</th>
              <th className="px-5 py-3 text-right font-semibold">Net</th>
              <th className="px-5 py-3 text-right font-semibold">Total</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {invoices.map((i) => (
              <tr key={i.id}>
                <td className="px-5 py-3 whitespace-nowrap">
                  {formatDate(i.createdAt)}
                </td>
                <td className="px-5 py-3 whitespace-nowrap font-medium">
                  {kindLabels[i.kind]}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  {users.get(i.userId)?.name}
                </td>
                <td className="max-w-xs px-5 py-3 text-charcoal-soft">
                  {i.description}
                </td>
                <td className="px-5 py-3 text-right">{formatMoney(i.net)}</td>
                <td className="px-5 py-3 text-right font-medium">
                  {formatMoney(i.net + i.vat)}
                </td>
                <td className="px-5 py-3">
                  {i.status === "paid" ? (
                    <span className="rounded-full bg-green-tint px-3 py-1 text-xs font-bold text-green-deep">
                      Paid
                    </span>
                  ) : (
                    <form
                      action={adminMarkInvoicePaid}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="invoiceId" value={i.id} />
                      <span className="rounded-full bg-orange-tint px-3 py-1 text-xs font-bold text-orange-deep">
                        Due
                      </span>
                      <Button
                        type="submit"
                        variant="secondary"
                        className="min-h-7 px-3 py-0.5 text-xs"
                      >
                        Mark paid
                      </Button>
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
