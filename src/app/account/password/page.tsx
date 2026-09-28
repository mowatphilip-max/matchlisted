"use client";

// Set or change your password.
//
// Two ways in: following a reset link (Supabase puts a temporary session in
// the URL, which the client library picks up), or while already signed in.
// The update runs in the browser against Supabase Auth so the new password
// never travels through our own server.

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base focus:border-orange-deep";

export default function SetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  useEffect(() => {
    // A reset link arrives with the session in the URL fragment; the client
    // library consumes it, after which getSession() returns a live session.
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      setReady(true);
    });
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError("Your password needs to be at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) setError(err.message);
    else setDone(true);
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl">Set your password</h1>

        {!ready && (
          <p className="mt-4 text-sm text-charcoal-soft">One moment…</p>
        )}

        {ready && !signedIn && !done && (
          <p className="mt-6 rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
            This link has expired or has already been used. Request a fresh
            one from the{" "}
            <Link href="/login" className="underline">
              sign-in page
            </Link>
            .
          </p>
        )}

        {done ? (
          <div className="mt-6 rounded-2xl bg-green-tint p-6">
            <p className="font-bold text-green-deep">Password saved.</p>
            <p className="mt-2 text-sm text-charcoal">
              You can sign in with it from now on.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-full bg-orange-deep px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-cta-hover"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          ready &&
          signedIn && (
            <form
              onSubmit={onSubmit}
              className="mt-6 space-y-4 rounded-2xl bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
            >
              {error && (
                <p className="rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
                  {error}
                </p>
              )}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-charcoal-soft">
                  At least 10 characters. A short phrase you&apos;ll remember
                  beats a complicated word.
                </p>
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-semibold">
                  Type it again
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving…" : "Save password"}
              </Button>
            </form>
          )
        )}
      </div>
    </Container>
  );
}
