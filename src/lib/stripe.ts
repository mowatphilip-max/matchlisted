// Stripe — hosted Checkout only.
//
// Card details never touch our servers: the customer pays on Stripe's own
// page and comes back. That keeps our PCI compliance at the lowest tier and
// means a mistake in our code cannot leak a card number.
//
// The golden rule enforced here: fulfilment is triggered by a
// signature-verified webhook, NEVER by the customer landing on the success
// page. Anyone can visit a success URL; only Stripe can sign a webhook.

import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY — see .env.example");
    cached = new Stripe(key);
  }
  return cached;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Guard against the classic disaster: test keys in production (payments
 * silently never arrive) or live keys in development (real money moves
 * during testing).
 */
export function assertKeyMatchesEnvironment(): void {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const isLiveKey = key.startsWith("sk_live_");
  const isProduction = process.env.NODE_ENV === "production";
  if (isLiveKey && !isProduction) {
    throw new Error("A LIVE Stripe key is set outside production. Stopping.");
  }
}

/** Money in Stripe is an integer of the smallest unit — pence, not pounds. */
export function toPence(pounds: number): number {
  return Math.round(pounds * 100);
}
