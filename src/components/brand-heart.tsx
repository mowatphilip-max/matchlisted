import { cn } from "@/lib/utils";
import { LOGO } from "./logo-paths";

/*
 * The brand heart as an icon: the small open heart from the logo (the dot of
 * ".com" and the O of HOMES). A line drawing in currentColor, so give it a
 * text colour, never a fill. Use it wherever the site says "match" with a heart.
 */
export function BrandHeart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="40 56.65 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={18}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <path d={LOGO.smallHeart} />
    </svg>
  );
}
