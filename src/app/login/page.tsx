import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestPasswordReset, signIn } from "@/lib/actions";

export const metadata: Metadata = { title: "Sign in" };

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base focus:border-orange-deep";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; registered?: string }>;
}) {
  const { error, reset, registered } = await searchParams;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl">Welcome back</h1>
        <p className="mt-2 text-charcoal-soft">
          Sign in to see your matches, your Hush Home and your Home Report.
        </p>

        {registered && (
          <p className="mt-6 rounded-xl bg-green-tint px-4 py-3 text-sm font-medium text-green-deep">
            Account created. Check your email to confirm the address, then
            sign in.
          </p>
        )}
        {reset === "sent" && (
          <p className="mt-6 rounded-xl bg-blue-tint px-4 py-3 text-sm font-medium text-blue-text">
            If that address has an account, a reset link is on its way.
          </p>
        )}
        {error === "bad-credentials" && (
          <p className="mt-6 rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
            That email and password don&apos;t match. Try again, or reset your
            password below.
          </p>
        )}

        <form
          action={signIn}
          className="mt-6 space-y-4 rounded-2xl bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </div>
          <SubmitButton className="w-full" pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
          <p className="text-center text-xs text-charcoal-soft">
            No account yet?{" "}
            <Link href="/join" className="font-semibold text-blue-text underline">
              Register free
            </Link>
          </p>
        </form>

        <form action={requestPasswordReset} className="mt-6">
          <label htmlFor="reset-email" className="sr-only">
            Email for a password reset link
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="reset-email"
              name="email"
              type="email"
              required
              placeholder="Forgotten your password?"
              className="min-h-10 flex-1 rounded-xl border border-hairline px-4 text-base focus:border-orange-deep"
            />
            <SubmitButton
              variant="ghost"
              size="sm"
              className="min-h-0 px-4 py-2 text-sm font-semibold text-blue-text underline hover:bg-transparent"
              pendingLabel="Sending the link…"
            >
              Email me a link
            </SubmitButton>
          </div>
        </form>
      </div>
    </Container>
  );
}
