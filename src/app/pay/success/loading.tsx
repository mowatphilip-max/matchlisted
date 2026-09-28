import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

// This route awaits a live Stripe read. It is also the most anxious screen in
// the product — the customer has just been charged and is waiting to be told
// it worked — so a blank frozen page is the worst possible response.
export default function Loading() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-lg rounded-[var(--radius-lg)] bg-paper p-8 text-center shadow-[var(--shadow-card)] ring-1 ring-hairline">
        <Skeleton className="mx-auto h-14 w-14 rounded-full" />
        <Skeleton className="mx-auto mt-5 h-8 w-56" />
        <Skeleton className="mx-auto mt-4 h-4 w-72" />
        <Skeleton className="mx-auto mt-2 h-4 w-64" />
        <span className="sr-only" role="status">
          Confirming your payment
        </span>
      </div>
    </Container>
  );
}
