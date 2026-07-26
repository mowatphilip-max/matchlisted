"use client";

// The orange heart doubles as the save/shortlist button — "the Matchlist".

import { useOptimistic, useTransition } from "react";
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

  return (
    <button
      type="button"
      aria-pressed={optimisticSaved}
      aria-label={optimisticSaved ? "Remove from your Matchlist" : "Save to your Matchlist"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          setOptimisticSaved(!optimisticSaved);
          const fd = new FormData();
          fd.set("homeId", homeId);
          await toggleSaveHome(fd);
        })
      }
      className={cn(
        "cursor-pointer rounded-full bg-white/95 p-2 shadow-[var(--shadow-card)] ring-1 ring-hairline transition-transform hover:scale-110",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          optimisticSaved ? "heart-pop fill-orange text-orange" : "text-charcoal-soft",
        )}
      />
    </button>
  );
}
