"use client";

// Split out of admin/layout.tsx purely so the nav can know where it is.
// The back-office is eleven pages deep and neither nav in the product marked
// the current page — `aria-current` appeared nowhere in the codebase — so
// "where am I" was unanswerable by sight or by screen reader.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        // /admin must match exactly or it would light up on every child route.
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "min-h-8 pointer-coarse:min-h-11 inline-flex items-center rounded-full px-3.5 py-1.5 text-sm transition-colors",
              active
                ? "bg-white font-semibold text-charcoal-deep"
                : "font-medium text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
