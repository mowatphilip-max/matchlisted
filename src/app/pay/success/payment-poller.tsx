"use client";

// Fulfilment is webhook-driven by design (a signed Stripe webhook, never the
// browser returning here), so there is a real window where the customer has
// paid and this page does not know it yet. Previously the only way out of that
// window was a "Refresh" link that gave no visible response when clicked, on
// the most anxious screen in the product.
//
// This re-runs the server component on an interval until the page flips to the
// paid branch and stops rendering the poller. It gives up after ~1 minute so a
// genuinely stuck webhook does not poll forever.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 20;

export function PaymentPoller() {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const id = setInterval(() => {
      attempts += 1;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(id);
        setGaveUp(true);
        return;
      }
      router.refresh();
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [router]);

  if (gaveUp) {
    return (
      <p className="mt-4 text-sm text-charcoal-soft">
        This is taking longer than usual. Your payment is still safe and your
        receipt will arrive by email — you can close this page. If nothing
        appears within the hour, email{" "}
        <a
          href="mailto:hello@matchlisted.com"
          className="font-semibold text-orange-deep underline"
        >
          hello@matchlisted.com
        </a>
        .
      </p>
    );
  }

  return (
    <p role="status" className="mt-4 text-sm text-charcoal-soft">
      Checking automatically&hellip;
    </p>
  );
}
