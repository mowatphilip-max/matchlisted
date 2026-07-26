import Link from "next/link";
import { cn } from "@/lib/utils";

// Pill buttons per the brand system:
//   primary (orange)  — act on a match: view, book, offer, sign
//   seller (charcoal) — seller-side actions
//   seeker (blue outline) — seeker-side secondary actions
//   secondary / ghost — quiet chrome
type Variant = "primary" | "seller" | "seeker" | "secondary" | "ghost" | "onDark";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 min-h-11 px-6 py-3 cursor-pointer select-none active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none motion-reduce:active:scale-100";

const variants: Record<Variant, string> = {
  primary:
    "bg-orange-deep text-white shadow-[0_2px_10px_-2px_rgb(180_83_12/0.5)] hover:bg-orange-cta-hover hover:shadow-[0_4px_18px_-4px_rgb(180_83_12/0.6)] focus-visible:outline-orange-deep",
  seller:
    "bg-charcoal text-white shadow-[0_2px_10px_-2px_rgb(35_39_43/0.45)] hover:bg-charcoal-deep hover:shadow-[0_4px_18px_-4px_rgb(35_39_43/0.55)] focus-visible:outline-charcoal",
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
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
