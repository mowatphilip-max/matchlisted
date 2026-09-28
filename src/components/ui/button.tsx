import Link from "next/link";
import { cn } from "@/lib/utils";

// Pill buttons per the brand system:
//   primary (orange)  — act on a match: view, book, offer, sign
//   seller (charcoal) — seller-side actions
//   seeker (blue outline) — seeker-side secondary actions
//   secondary / ghost — quiet chrome
type Variant = "primary" | "seller" | "seeker" | "secondary" | "ghost" | "onDark";

// Sizes by the room the control is in, not by how important it looks:
//   sm — dense rows: admin tables, inline record actions
//   md — the default everywhere a person is making a decision
//   lg — the one CTA a page is actually asking for
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-wide " +
  "transition-[background-color,box-shadow,transform,opacity,outline-color] " +
  "duration-[var(--duration-press)] ease-out " +
  "cursor-pointer select-none active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none motion-reduce:active:scale-100";

// `sm` stays visually compact under a mouse but still hands a finger a 44px
// target — that escape hatch is what lets dense admin rows exist without
// failing touch-target sizing.
const sizes: Record<Size, string> = {
  sm: "min-h-8 pointer-coarse:min-h-11 px-4 py-1.5 text-xs",
  md: "min-h-11 px-6 py-3 text-sm",
  lg: "min-h-12 px-7 py-3.5 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-orange-deep text-white shadow-[0_2px_10px_-2px_rgb(185_74_28/0.5)] hover:bg-orange-cta-hover hover:shadow-[0_4px_18px_-4px_rgb(185_74_28/0.6)] focus-visible:outline-orange-deep",
  seller:
    "bg-charcoal text-white shadow-[0_2px_10px_-2px_rgb(44_57_71/0.45)] hover:bg-charcoal-deep hover:shadow-[0_4px_18px_-4px_rgb(44_57_71/0.55)] focus-visible:outline-charcoal",
  seeker:
    "bg-transparent text-blue-deep ring-1 ring-inset ring-blue-deep/60 hover:bg-blue-tint hover:ring-blue-deep focus-visible:outline-blue-deep",
  secondary:
    "bg-transparent text-charcoal ring-1 ring-inset ring-charcoal/25 hover:ring-charcoal/50 hover:bg-charcoal/[0.04] focus-visible:outline-orange-deep",
  ghost:
    "bg-transparent text-orange-deep hover:bg-orange-tint focus-visible:outline-orange-deep px-4",
  onDark:
    "bg-white text-charcoal hover:bg-orange-tint focus-visible:outline-white",
};

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
