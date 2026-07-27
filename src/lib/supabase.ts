// Supabase clients.
//
// Two of them, and the difference matters:
//
//   serverDb()  — uses the SECRET key. Bypasses row-level security, so it
//                 must NEVER be imported into a client component. Every
//                 query made with it is trusted, which means authorisation
//                 has to be checked in our own code before we call it.
//
//   browserDb() — uses the PUBLISHABLE key, which is safe to ship to the
//                 browser. Row-level security applies, and since we grant
//                 no policies it currently reads nothing. It exists for
//                 Supabase Auth (login/signup) only.
//
// "Row-level security" = database-enforced rules about which rows a caller
// may see, independent of our application code.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

let cachedServer: SupabaseClient | null = null;

/** Server-only client. Full access — check permissions before you call it. */
export function serverDb(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "serverDb() was called in the browser. This client holds the secret " +
        "key and must only run on the server.",
    );
  }
  if (!cachedServer) {
    cachedServer = createClient(
      required("NEXT_PUBLIC_SUPABASE_URL"),
      required("SUPABASE_SECRET_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return cachedServer;
}

/** Browser-safe client — for Supabase Auth. Reads nothing without policies. */
export function browserDb(): SupabaseClient {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  );
}

/** True when the database is configured — lets code fall back while we migrate. */
export function databaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
  );
}
