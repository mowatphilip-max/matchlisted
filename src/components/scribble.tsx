import { cn } from "@/lib/utils";

// The hand-drawn Match Orange underline — the brand's "swipe" of approval.
// Born in the hero headline; reuse it sparingly, on the one word in a
// heading that carries the promise.
export function Scribble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative whitespace-nowrap", className)}>
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 300 12"
        preserveAspectRatio="none"
        className="absolute -bottom-1.5 left-0 h-2.5 w-full text-orange"
      >
        <path
          d="M2 9 C 75 2, 225 2, 298 8"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}
