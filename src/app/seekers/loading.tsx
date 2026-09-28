import { Container } from "@/components/ui/container";
import { Skeleton, SkeletonCardGrid } from "@/components/ui/skeleton";

// /seekers is `force-dynamic` and awaits fetchMowattSeekers() — a remote
// Google Sheets read. Without this boundary the route simply froze on the
// previous page until the round-trip returned.
export default function Loading() {
  return (
    <Container className="py-12">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-10 w-2/3 max-w-xl" />
      <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
      <SkeletonCardGrid count={6} />
      <span className="sr-only" role="status">
        Loading Quiet Seekers
      </span>
    </Container>
  );
}
