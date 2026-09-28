"use client";

// The pending-state primitive. Every server-action form in the product used to
// submit with no acknowledgement at all — including multi-megabyte Home Report
// uploads and the two contract-signing forms, where the wait is seconds long and
// a silent button reads as "nothing happened, click it again".
//
// `useFormStatus` must be called from a component *inside* the <form>, which is
// why this is its own file rather than a prop on Button.

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: ButtonProps & { pendingLabel?: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? (
        <>
          {/* Hidden under reduced motion — a frozen spinner reads as a hang.
              The label carries the message on its own. */}
          <LoaderCircle
            aria-hidden
            className="h-4 w-4 animate-spin motion-reduce:hidden"
          />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
