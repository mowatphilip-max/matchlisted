/* eslint-disable @next/next/no-img-element */
// Always the supplied artwork from /public/brand — never plain type.
// logo-horizontal.png (wordmark + .com) and icon.png (house-heart) are
// Phil's real files; the remaining .svg files are placeholders.

import { cn } from "@/lib/utils";

export function LogoHorizontal({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-horizontal.png"
      alt="Matchlisted.com"
      className={cn("h-10 w-auto", className)}
    />
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <img
      src="/brand/icon.png"
      alt=""
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-horizontal.png"
      alt="Matchlisted.com"
      className={cn("h-6 w-auto", className)}
    />
  );
}
