"use client";

// Split out of site-header.tsx so the nav can mark the current page. The header
// itself stays a server component (it awaits currentUser and notifications);
// only this list needs the pathname.
//
// `aria-current="page"` appeared nowhere in the codebase before this — neither
// nav told you where you were, by sight or by screen reader.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SiteNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-6 text-sm font-medium text-charcoal-soft md:flex">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            // nav-link draws the orange underline on hover/focus; `is-current`
            // holds it open for the page you are on, so the active state and
            // the hover state speak the same visual language.
            className={cn(
              "nav-link transition-colors hover:text-charcoal",
              active && "is-current text-charcoal",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
