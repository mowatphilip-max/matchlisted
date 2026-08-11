import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { currentUser } from "@/lib/session";
import { notificationsForUser } from "@/lib/db";
import { signOut } from "@/lib/actions";
import { LogoHorizontal, LogoMark } from "./logo";
import { ButtonLink } from "./ui/button";

// IA per BUILD-BRIEF.md Phase 1: audience-first labels. "For sellers" and
// "For buyers" are the pitch pages; "Who's looking" is the live seeker list.
const nav = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/hush-homes", label: "For sellers" },
  { href: "/quiet-seekers", label: "For buyers" },
  { href: "/seekers", label: "Who's looking" },
  { href: "/#fees", label: "Fees" },
];

export async function SiteHeader() {
  const user = await currentUser();
  const unread = user
    ? (await notificationsForUser(user.id)).filter((n) => !n.readAt).length
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-white/92 shadow-[0_1px_12px_rgb(61_79_97/0.05)] backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="logo-home-link flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="Matchlisted home"
        >
          <LogoMark className="h-8 w-auto text-charcoal sm:h-9" />
          <LogoHorizontal className="hidden h-8 min-[420px]:block sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-charcoal-soft md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link transition-colors hover:text-charcoal"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/notifications"
                className="relative rounded-full p-2 text-charcoal-soft transition-colors hover:bg-soft hover:text-charcoal"
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
              {user.isAdmin && (
                <ButtonLink href="/admin" variant="secondary" className="hidden min-h-9 px-4 py-1.5 sm:inline-flex">
                  Admin
                </ButtonLink>
              )}
              <ButtonLink href="/dashboard" variant="primary" className="min-h-9 px-4 py-1.5">
                Dashboard
              </ButtonLink>
              <form action={signOut}>
                <button className="hidden cursor-pointer px-2 text-sm font-medium text-charcoal-soft hover:text-charcoal sm:block">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap px-2 text-sm font-medium text-blue-deep hover:underline"
              >
                Sign in
              </Link>
              <ButtonLink href="/join" className="min-h-9 px-4 py-1.5">
                Find your match
              </ButtonLink>
            </>
          )}

          <details className="relative md:hidden">
            <summary className="flex cursor-pointer list-none items-center rounded-full p-2 text-charcoal-soft hover:bg-soft [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </summary>
            <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-hairline bg-white p-2 shadow-[var(--shadow-card)]">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-charcoal hover:bg-soft"
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <form action={signOut}>
                  <button className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-charcoal hover:bg-soft">
                    Sign out
                  </button>
                </form>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
