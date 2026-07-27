// Guard for developer-only routes.
//
// These endpoints reset data and dump datasets — useful on a laptop, a
// liability on the public internet. They now refuse to run anywhere except
// local development, so they cannot ship to production even by accident.

import { notFound } from "next/navigation";

export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Call at the top of any dev-only route handler or page. */
export function requireDevEnvironment(): void {
  if (!isDevEnvironment()) notFound();
}
