import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/site";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Matchlisted | Where Quiet Seekers meet Hush Homes",
    template: "%s | Matchlisted",
  },
  description:
    "The dating site for homes, across all of Scotland. No listing fees, registered Quiet Seekers, a Match % for every pairing. Private by default. Just Introductions.",
  openGraph: {
    title: "Matchlisted | Where Quiet Seekers meet Hush Homes",
    description:
      "Every home gets a listing. Every buyer gets a profile. The Matchlist does the rest, across all of Scotland.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-charcoal">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-charcoal focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {/* Demo runs only (MATCHLISTED_DEMO=1): every person and home on
            screen is fictional, and the page says so (DEMO-VIDEO.md rule 3). */}
        {process.env.MATCHLISTED_DEMO === "1" && (
          <div className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-full bg-charcoal/85 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm">
            Demonstration data
          </div>
        )}
      </body>
    </html>
  );
}
