import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { demoSignIn, signInWithEmail } from "@/lib/actions";
import { getUserByEmail } from "@/lib/db";

export const metadata: Metadata = { title: "Sign in" };

const personas = [
  {
    email: "ailsa@demo.matchlisted.com",
    label: "Ailsa — Quiet Seeker",
    detail: "East Lothian brief, a 99% match waiting",
  },
  {
    email: "gordon@demo.matchlisted.com",
    label: "Gordon — Hush Home seller",
    detail: "Live listing in Gullane",
  },
  {
    email: "rachel@demo.matchlisted.com",
    label: "Rachel — both roles",
    detail: "Selling in Shawlands, seeking in East Lothian",
  },
  {
    email: "struan@demo.matchlisted.com",
    label: "Struan — new seller",
    detail: "Draft listing, Home Report still to order",
  },
  {
    email: "kirsty@demo.matchlisted.com",
    label: "Kirsty — buying now",
    detail: "Offer accepted on a Troon bungalow",
  },
  {
    email: "phil@demo.matchlisted.com",
    label: "Phil — admin",
    detail: "Full back-office",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl">Welcome back</h1>
        <p className="mt-2 text-charcoal-soft">
          The prototype runs on sample data — sign in as a demo persona, or
          with an email you registered this session.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-tint px-4 py-3 text-sm font-medium text-red-deep">
            {error === "exists"
              ? "That email is already registered — sign in below."
              : "We couldn't find that account. Try a demo persona, or register via “Find your match”."}
          </p>
        )}

        <div className="mt-8 space-y-3">
          {personas.map((p) => {
            const user = getUserByEmail(p.email);
            if (!user) return null;
            return (
              <form action={demoSignIn} key={p.email}>
                <input type="hidden" name="userId" value={user.id} />
                <button className="w-full cursor-pointer rounded-2xl bg-paper p-4 text-left shadow-[var(--shadow-card)] ring-1 ring-hairline transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                  <span className="block font-semibold">{p.label}</span>
                  <span className="mt-0.5 block text-sm text-charcoal-soft">
                    {p.detail}
                  </span>
                </button>
              </form>
            );
          })}
        </div>

        <form
          action={signInWithEmail}
          className="mt-8 rounded-2xl bg-soft p-5"
        >
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-charcoal"
          >
            Or sign in with your email
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="min-h-11 w-full rounded-full border border-hairline bg-white px-5 text-sm outline-none focus:border-blue-deep"
            />
            <Button type="submit" variant="seeker" className="shrink-0">
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
