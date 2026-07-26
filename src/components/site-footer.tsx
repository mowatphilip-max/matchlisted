import Link from "next/link";
import { Wordmark } from "./logo";
import { Container } from "./ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-charcoal-deep text-white">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="inline-block rounded-xl bg-white p-3">
            <Wordmark className="h-8" />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Where Quiet Seekers meet Hush Homes. No boards. No portals. Just
            Introductions — across all of Scotland.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">
            Sellers
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><Link href="/hush-homes" className="hover:text-white">List a Hush Home — free</Link></li>
            <li><Link href="/#fees" className="hover:text-white">Home Reports</Link></li>
            <li><Link href="/join?as=seller" className="hover:text-white">Create a seller account</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">
            Buyers
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><Link href="/quiet-seekers" className="hover:text-white">Become a Quiet Seeker</Link></li>
            <li><Link href="/seekers" className="hover:text-white">Browse live Quiet Seekers</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-white">How matching works</Link></li>
            <li><Link href="/#fees" className="hover:text-white">The 0.8% sourcing fee</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">
            Matchlisted
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
            <li><a href="mailto:hello@matchlisted.com" className="hover:text-white">hello@matchlisted.com</a></li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Matchlisted.com — all fees quoted + VAT.</p>
          <p>Flirtatious about homes. Serious about money.</p>
        </Container>
      </div>
    </footer>
  );
}
