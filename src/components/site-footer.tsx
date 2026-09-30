import Link from "next/link";
import { Logo } from "./logo";
import { Container } from "./ui/container";
import { LEGAL } from "@/lib/site";

// BUILD-BRIEF.md §9 + Phase 1 review item 4: the exact trading-name
// construction. Facts still to be supplied render as bracketed markers —
// honest placeholders, never invented numbers.
const legalSentence =
  `${LEGAL.tradingName} is a trading name of ${LEGAL.companyName}, ` +
  `registered in Scotland no. ${LEGAL.companyNumber ?? "[SC______]"}. ` +
  `Registered office: ${LEGAL.registeredOffice ?? "[address to follow]"}. ` +
  `VAT registration no. ${LEGAL.vatNumber ?? "[______]"}. ` +
  `Member of ${LEGAL.redressSchemeName ?? "[redress scheme]"} no. ${LEGAL.redressSchemeNumber ?? "[______]"}. ` +
  `Supervised by HMRC for anti-money-laundering purposes, no. ${LEGAL.amlSupervisionNumber ?? "[______]"}. ` +
  `ICO registration no. ${LEGAL.icoRegistration ?? "[______]"}.`;

const policyLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/complaints", label: "Complaints" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-charcoal-deep text-white">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo motion="loop" className="h-16 text-white" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Where Quiet Seekers meet Hush Homes. No boards. No portals. Just
            Introductions, across all of Scotland.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">
            Sellers
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><Link href="/hush-homes" className="hover:text-white">List a Hush Home</Link></li>
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
            <li><Link href="/#fees" className="hover:text-white">The £360 buyer fee</Link></li>
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
        <Container className="space-y-3 py-6 text-xs text-white/50">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Matchlisted.com · all prices include VAT.</p>
            <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legal">
              {policyLinks.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="max-w-4xl leading-relaxed text-white/35">
            {legalSentence}
          </p>
        </Container>
      </div>
    </footer>
  );
}
