"use client";

// Route-level error boundary. Without this, a throw anywhere in a server
// component renders Next's default error screen — which on production says
// "Application error: a client-side exception has occurred" and nothing else.
// Several routes here await remote data that can genuinely fail (the Mowatt
// seeker sheet on /seekers and /, a live Stripe read on /pay/success), so the
// failure path is real, not theoretical.

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-lg rounded-[var(--radius-lg)] bg-paper p-8 text-center shadow-[var(--shadow-card)] ring-1 ring-hairline">
        <h1 className="text-3xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-charcoal-soft">
          This one is on us, not on you. Nothing you were working on has been
          lost — try again, and if it keeps happening, tell us.
        </p>
        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-muted">
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Back to the start
          </ButtonLink>
        </div>
        <p className="mt-6 text-xs text-charcoal-soft">
          Still stuck?{" "}
          <a
            href="mailto:hello@matchlisted.com"
            className="font-semibold text-orange-deep underline"
          >
            hello@matchlisted.com
          </a>
        </p>
      </div>
    </Container>
  );
}
