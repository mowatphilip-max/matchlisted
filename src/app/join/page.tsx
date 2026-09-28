import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Home, Lock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SubmitButton } from "@/components/ui/submit-button";
import { register } from "@/lib/actions";
import { getBriefByPublicRef } from "@/lib/db";
import { findMowattSeeker, toBriefLike } from "@/lib/mowatt-bridge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Join Matchlisted" };

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; error?: string; seeker?: string }>;
}) {
  const { as, error, seeker } = await searchParams;
  let seekerBrief = seeker ? await getBriefByPublicRef(seeker) : undefined;
  let sheetSeeker = false;
  if (seeker && !seekerBrief?.contract) {
    const mowatt = await findMowattSeeker(seeker);
    if (mowatt?.active) {
      seekerBrief = toBriefLike(mowatt);
      sheetSeeker = true;
    }
  }
  const intent = as === "seller" || seekerBrief ? "seller" : "seeker";

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl">Create your free account</h1>
        <p className="mt-2 text-charcoal-soft">
          Every account can hold both sides: a Hush Home Listing and a Quiet
          Seeker Profile. Start with whichever fits today.
        </p>

        {seekerBrief && (seekerBrief.contract || sheetSeeker) && (
          <div className="mt-6 rounded-2xl bg-blue-tint p-5 ring-1 ring-blue-deep/20">
            <p className="text-sm font-bold text-blue-text">
              You&apos;re one step from reaching {seekerBrief.publicRef}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-charcoal-soft">
              &ldquo;{seekerBrief.headline}&rdquo;. Create your free account
              and we&apos;ll note your interest right away. Once your Hush
              Home profile and Home Report are in place, we&apos;ll offer
              them the introduction.
            </p>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-charcoal-soft">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Neither side&apos;s identity is shared until they say yes.
            </p>
          </div>
        )}

        {error === "invalid" && (
          <p className="mt-4 rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
            Please give us your name and a valid email address.
          </p>
        )}
        {error === "weak-password" && (
          <p className="mt-4 rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
            Your password needs to be at least 10 characters.
          </p>
        )}
        {error === "signup-failed" && (
          <p className="mt-4 rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
            We couldn&apos;t create that account. If you already have one,{" "}
            <Link href="/login" className="underline">
              sign in instead
            </Link>
            .
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            href="/join"
            className={cn(
              "rounded-2xl border p-4 text-center transition-colors",
              intent === "seeker"
                ? "border-blue-deep bg-blue-tint"
                : "border-hairline bg-paper hover:bg-soft",
            )}
          >
            <Heart
              className={cn(
                "mx-auto h-6 w-6",
                intent === "seeker" ? "fill-blue-deep text-blue-deep" : "text-charcoal-soft",
              )}
            />
            <span className="mt-2 block text-sm font-bold">
              I&apos;m looking for a home
            </span>
            <span className="block text-xs text-charcoal-soft">
              Become a Quiet Seeker
            </span>
          </Link>
          <Link
            href="/join?as=seller"
            className={cn(
              "rounded-2xl border p-4 text-center transition-colors",
              intent === "seller"
                ? "border-orange-deep bg-orange-tint"
                : "border-hairline bg-paper hover:bg-soft",
            )}
          >
            <Home
              className={cn(
                "mx-auto h-6 w-6",
                intent === "seller" ? "text-orange-deep" : "text-charcoal-soft",
              )}
            />
            <span className="mt-2 block text-sm font-bold">
              I&apos;m selling a home
            </span>
            <span className="block text-xs text-charcoal-soft">
              List a Hush Home
            </span>
          </Link>
        </div>

        <form
          action={register}
          className="mt-6 space-y-4 rounded-2xl bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline"
        >
          <input type="hidden" name="intent" value={intent} />
          {seekerBrief && (seekerBrief.contract || sheetSeeker) && (
            <input type="hidden" name="seeker" value={seekerBrief.publicRef} />
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold">
              Full name
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base focus:border-orange-deep"
            />
          </div>
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
              className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base focus:border-orange-deep"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold">
              Choose a password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-hairline px-4 text-base focus:border-orange-deep"
            />
            <p className="mt-1 text-xs text-charcoal-soft">
              At least 10 characters. A short phrase you&apos;ll remember beats
              a complicated word.
            </p>
          </div>
          <SubmitButton className="w-full" pendingLabel="Creating your account…">
            {intent === "seller"
              ? "Create account & start my listing"
              : "Create account & build my profile"}
          </SubmitButton>
          <p className="text-center text-xs text-charcoal-soft">
            Free to join. Contracts are signed later, at listing or briefing.
            Nothing is owed today. Already registered?{" "}
            <Link href="/login" className="text-blue-text underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </Container>
  );
}
