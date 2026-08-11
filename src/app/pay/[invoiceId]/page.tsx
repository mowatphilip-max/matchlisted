import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CreditCard, Lock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/session";
import { getInvoice } from "@/lib/db";
import { payInvoice } from "@/lib/actions";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Checkout" };

// Demo checkout: this page is the seam where Stripe Checkout goes in
// production — the invoice model and post-payment routing already exist.

export default async function PayPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { invoiceId } = await params;
  const invoice = await getInvoice(invoiceId);
  if (!invoice || invoice.userId !== user.id) notFound();
  if (invoice.status === "paid") redirect("/dashboard");

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl">Checkout</h1>
        <div className="mt-6 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
          <p className="text-sm text-charcoal-soft">{invoice.description}</p>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-charcoal-soft">Net</dt>
              <dd>{formatMoney(invoice.net)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-charcoal-soft">VAT (20%)</dt>
              <dd>{formatMoney(invoice.vat)}</dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatMoney(invoice.net + invoice.vat)}</dd>
            </div>
          </dl>

          <form action={payInvoice} className="mt-6">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <div className="rounded-2xl bg-soft p-4 text-sm text-charcoal-soft">
              <p className="flex items-center gap-2 font-semibold text-charcoal">
                <CreditCard className="h-4 w-4" /> Demo payment
              </p>
              <p className="mt-1">
                The prototype simulates the card step; production uses Stripe
                Checkout here. Clicking pay marks the invoice paid and moves
                your journey forward.
              </p>
            </div>
            <Button type="submit" className="mt-4 w-full">
              <Lock className="h-4 w-4" /> Pay {formatMoney(invoice.net + invoice.vat)}
            </Button>
          </form>
        </div>
      </div>
    </Container>
  );
}
