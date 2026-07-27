import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { getInvoice } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Payment received" };
export const dynamic = "force-dynamic";

/**
 * Where Stripe sends the customer afterwards.
 *
 * This page only REPORTS status — it never fulfils the order. Fulfilment
 * happens on the signed webhook, because anyone can visit this URL. If the
 * webhook hasn't landed yet (usually a second or two) we say so honestly
 * rather than pretending nothing happened.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { session_id: sessionId } = await searchParams;
  if (!sessionId || !stripeConfigured()) redirect("/dashboard");

  const session = await stripe().checkout.sessions.retrieve(sessionId);
  const invoiceId = session.metadata?.invoiceId ?? session.client_reference_id;
  const invoice = invoiceId ? await getInvoice(invoiceId) : undefined;

  // Only ever show someone their own payment.
  if (!invoice || invoice.userId !== user.id) redirect("/dashboard");

  const paid = invoice.status === "paid";
  const total = invoice.net + invoice.vat;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg text-center">
        {paid ? (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-tint text-green-deep">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-3xl">Payment received</h1>
            <p className="mt-3 text-charcoal-soft">
              Thank you — {formatMoney(total)} paid. Your surveyor has been
              instructed and will contact you directly to arrange the visit.
              A receipt is on its way to {user.email}.
            </p>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-tint text-blue-deep">
              <Clock className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-3xl">Payment going through</h1>
            <p className="mt-3 text-charcoal-soft">
              Your card has been accepted and we&apos;re just confirming it —
              this usually takes a few seconds. Your money is safe and nothing
              is lost if you close this page; refresh in a moment, or check
              your dashboard shortly.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={invoice.homeId ? `/dashboard/home/${invoice.homeId}` : "/dashboard"}>
            Back to my Hush Home
          </ButtonLink>
          {!paid && (
            <ButtonLink href={`/pay/success?session_id=${sessionId}`} variant="secondary">
              Refresh
            </ButtonLink>
          )}
        </div>
      </div>
    </Container>
  );
}
