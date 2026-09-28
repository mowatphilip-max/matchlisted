"use client";

// The orange heart doubles as the save/shortlist button — "the Matchlist".

import { useOptimistic, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleSaveHome } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function HeartButton({
  homeId,
  saved,
  className,
}: {
  homeId: string;
  saved: boolean;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  // Counts presses, not saved-ness. The pop is feedback for an action the user
  // just took, so it must never fire from derived state — keying the icon on
  // this both scopes it to the press and guarantees a clean restart when the
  // heart is tapped again mid-animation (a keyframe cannot otherwise retarget).
  const [presses, setPresses] = useState(0);

  return (
    <button
      type="button"
      aria-pressed={optimisticSaved}
      aria-label={optimisticSaved ? "Remove from your Matchlist" : "Save to your Matchlist"}
      aria-busy={isPending}
      onClick={() => {
        setPresses((n) => n + 1);
        startTransition(async () => {
          setOptimisticSaved(!optimisticSaved);
          const fd = new FormData();
          fd.set("homeId", homeId);
          await toggleSaveHome(fd);
        });
      }}
      className={cn(
        "min-h-11 min-w-11 cursor-pointer rounded-full bg-white/95 p-2 shadow-[var(--shadow-card)]",
        "ring-1 ring-hairline transition-transform duration-[var(--duration-press)] ease-out",
        "hover:scale-110 active:scale-[0.97] motion-reduce:active:scale-100",
        className,
      )}
    >
      <Heart
        key={presses}
        className={cn(
          "h-5 w-5 transition-colors",
          optimisticSaved ? "fill-orange text-orange" : "text-charcoal-soft",
          presses > 0 && optimisticSaved && "heart-pop",
        )}
      />
    </button>
  );
}
