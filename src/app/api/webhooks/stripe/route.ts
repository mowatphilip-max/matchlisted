// Stripe webhook — the ONLY thing that fulfils an order.
//
// Why not the success page: a customer can close the browser, lose signal,
// or type the success URL straight into the address bar. None of those mean
// money arrived. Stripe signs every webhook with a shared secret, so this
// is the only message we can actually trust.
//
// Three protections, all load-bearing:
//   1. Signature verification — an unsigned or wrongly signed request is
//      rejected before we read a single field.
//   2. Idempotency — every event id is recorded, so Stripe's retries can
//      never instruct two surveys.
//   3. We answer 200 only when we've finished. A failure returns 500 so
//      Stripe retries (it keeps trying for about three days).

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { serverDb } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { fulfilHomeReportOrder, recordRefund } from "@/lib/fulfilment";

// Stripe signs the RAW body — Next must not parse or reformat it.
export const dynamic = "force-dynamic";

/**
 * Returns false only if this event was already handled SUCCESSFULLY.
 *
 * Seeing the id before isn't enough: if a previous attempt failed halfway,
 * Stripe's retry must be allowed through, or a paid order would never be
 * fulfilled. Only a completed run (processed_at set, no error) blocks it.
 */
async function claimEvent(id: string, type: string): Promise<boolean> {
  const db = serverDb();
  const { error } = await db.from("webhook_events").insert({ id, type });
  if (!error) return true;

  if (error.code === "23505") {
    const { data } = await db
      .from("webhook_events")
      .select("processed_at, error")
      .eq("id", id)
      .maybeSingle();
    const finishedCleanly = Boolean(data?.processed_at) && !data?.error;
    return !finishedCleanly; // let a previously-failed event retry
  }
  throw new Error(`webhook ledger: ${error.message}`);
}

async function markProcessed(id: string, error?: string): Promise<void> {
  await serverDb()
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString(), error: error ?? null })
    .eq("id", id);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — refusing webhooks.");
    return new NextResponse("Webhooks not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing signature", { status: 400 });

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    // Wrong secret, tampered body, or someone poking the endpoint.
    console.error("stripe webhook signature rejected:", (err as Error).message);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (!(await claimEvent(event.id, event.type))) {
    // Already handled — acknowledge so Stripe stops retrying.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Only fulfil when the money actually cleared.
        if (session.payment_status !== "paid") break;
        const invoiceId =
          session.metadata?.invoiceId ?? session.client_reference_id ?? "";
        if (!invoiceId) throw new Error("no invoice id on session");
        const result = await fulfilHomeReportOrder(
          invoiceId,
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : undefined,
        );
        if (!result.ok) throw new Error(result.reason ?? "fulfilment failed");
        break;
      }

      case "checkout.session.expired": {
        // The customer wandered off. Nothing to undo — the invoice simply
        // stays unpaid and shows as abandoned in admin.
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const invoiceId = charge.metadata?.invoiceId;
        if (invoiceId) {
          await recordRefund(invoiceId, (charge.amount_refunded ?? 0) / 100);
        }
        break;
      }

      case "charge.dispute.created": {
        // A chargeback. Needs a person, not code — surface it loudly.
        console.error("STRIPE DISPUTE OPENED", event.id);
        break;
      }

      default:
        break;
    }

    await markProcessed(event.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = (err as Error).message;
    console.error(`webhook ${event.type} (${event.id}) failed:`, message);
    await markProcessed(event.id, message);
    // 500 tells Stripe to retry — better than losing a paid order.
    return new NextResponse("Handler failed", { status: 500 });
  }
}
