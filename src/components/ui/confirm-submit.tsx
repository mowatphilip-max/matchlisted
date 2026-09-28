"use client";

// Two-step confirmation for destructive and financial submits.
//
// There was no confirmation of any kind in this product — `confirm(` appeared
// zero times — while "Record withdrawal" wrote ledger entries and invoices from
// a 12px underlined text run at the end of a table row, and "No thanks"
// permanently declined an introduction. This is the smallest honest fix: the
// first click arms, the second commits, and it disarms itself if you walk away.
//
// Deliberately not a modal. The one hand-rolled dialog in this codebase has no
// focus trap and no scroll lock, so adding a second one would spread a bug
// rather than fix a problem. An inline arm/commit needs no focus management,
// cannot trap anybody, and keeps the action next to the row it belongs to.

import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

const DISARM_AFTER_MS = 5000;

export function ConfirmSubmit({
  children,
  confirmLabel,
  pendingLabel,
  className,
  variant = "secondary",
  size,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & {
  /** Shown once armed. Say what will happen, not "Are you sure?". */
  confirmLabel: React.ReactNode;
  pendingLabel?: React.ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!armed) return;
    timer.current = setTimeout(() => setArmed(false), DISARM_AFTER_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [armed]);

  // Once submitting, stop offering the escape hatch.
  if (pending) {
    return (
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={className}
        disabled
        aria-busy
        {...props}
      >
        <LoaderCircle
          aria-hidden
          className="h-4 w-4 animate-spin motion-reduce:hidden"
        />
        {pendingLabel ?? confirmLabel}
      </Button>
    );
  }

  if (!armed) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={() => setArmed(true)}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="submit"
        variant="primary"
        size={size}
        className={className}
        disabled={disabled}
        // Focus follows the arm so the keyboard path is one Enter, then one
        // more — not a hunt for where the button went.
        autoFocus
        onBlur={() => setArmed(false)}
        {...props}
      >
        {confirmLabel}
      </Button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="min-h-8 pointer-coarse:min-h-11 cursor-pointer px-2 text-xs font-medium text-charcoal-soft underline hover:text-charcoal"
      >
        Cancel
      </button>
      <span role="status" className="sr-only">
        Confirm to continue, or cancel.
      </span>
    </span>
  );
}
