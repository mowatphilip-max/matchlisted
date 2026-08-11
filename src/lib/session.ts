// Sessions, backed by Supabase Auth.
//
// The old prototype trusted a cookie that simply held a user id — anyone
// who guessed `ml_uid=u-phil` became an administrator. Now the browser
// holds a signed, expiring token issued by Supabase, verified on every
// request. Nothing about who you are is taken on trust from the browser.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getUser } from "./db";
import type { User } from "./types";

/** Supabase client bound to the request's cookies — reads/refreshes the session. */
async function authClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) {
              jar.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Middleware refreshes the session instead — safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * The signed-in user, or null. Verifies the token with Supabase rather than
 * trusting the cookie's contents, then loads their profile.
 */
export async function currentUser(): Promise<User | null> {
  const supabase = await authClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return (await getUser(data.user.id)) ?? null;
}

/** The authenticated account id, without loading the profile. */
export async function currentUserId(): Promise<string | null> {
  const supabase = await authClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await authClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    // Deliberately vague: saying "no such account" tells an attacker which
    // email addresses are registered.
    return { ok: false, message: "That email and password don't match." };
  }
  return { ok: true };
}

/**
 * Creates the login account. When the project requires email confirmation,
 * Supabase returns a user but no session — the caller must send them to
 * confirm rather than on to a signed-in page they cannot reach.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<
  | { ok: true; userId: string; needsConfirmation: boolean }
  | { ok: false; message: string }
> {
  const supabase = await authClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) {
    return { ok: false, message: error?.message ?? "Could not create that account." };
  }
  return {
    ok: true,
    userId: data.user.id,
    needsConfirmation: !data.session,
  };
}

export async function sendPasswordReset(email: string): Promise<void> {
  const supabase = await authClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${site}/account/password`,
  });
}

export async function clearSession(): Promise<void> {
  const supabase = await authClient();
  await supabase.auth.signOut();
}

/** True when the signed-in user is an administrator. */
export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  return Boolean(user?.isAdmin);
}
