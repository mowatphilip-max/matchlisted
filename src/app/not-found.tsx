import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Not found" };

// `notFound()` is already called from real routes — e.g. a home id that does
// not resolve — so this page is reachable in normal use, not just by typos.
export default function NotFound() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-orange-deep">
          404
        </p>
        <h1 className="mt-4 text-3xl">We can&apos;t find that one</h1>
        <p className="mt-3 text-sm text-charcoal-soft">
          The page may have moved, or a home may have come off the Matchlist.
          Everything else is still where you left it.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/hush-homes">Browse Hush Homes</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Back to the start
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
