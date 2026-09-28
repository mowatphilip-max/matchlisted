import type { Metadata } from "next";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { MatchRing } from "@/components/match-ring";
import { Scribble } from "@/components/scribble";
import {
  MatchReportForm,
  type ReportFormInitial,
} from "@/components/match-report/report-form";
import { captureMatchReportLead } from "@/lib/actions";
import { getArea } from "@/lib/areas";
import {
  runMatchReport,
  type MatchReportInput,
  type ValueBandId,
} from "@/lib/match-report";
import { CONFIG } from "@/lib/site";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/types";

// THE MATCH REPORT (BUILD-BRIEF.md §6.1) — the most important screen in the
// product, and the destination for every seller-side advert. Public, no
// account, no card, no address. It tells a SELLER about matching BUYERS and
// never exposes anything about any property (§3 applies in both directions).
// Counts are live from the Matchlist — never cached, never fabricated.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Match Report",
  description:
    "See how many registered Quiet Seekers are looking for a home like yours, right now. Four details. No account, no card, no address.",
};

/** Parse and validate the four inputs; null unless ALL four are present and real. */
function parseInput(params: {
  area?: string;
  beds?: string;
  type?: string;
  band?: string;
}): MatchReportInput | null {
  const area = params.area ? getArea(params.area) : undefined;
  const beds = Math.floor(Number(params.beds ?? 0));
  const type = PROPERTY_TYPES.find((t) => t.value === params.type)?.value;
  const band = CONFIG.valueBands.find((b) => b.id === params.band)?.id;
  if (!area || beds < 1 || beds > 6 || !type || !band) return null;
  return { areaId: area.id, beds, type: type as PropertyType, band: band as ValueBandId };
}

/**
 * The §6.1 tease: the top brief's headline, partially obscured. The hidden
 * tail is a decorative placeholder, not blurred real text — nothing a
 * visitor's dev tools can recover before they register.
 */
function ObscuredHeadline({ text }: { text: string }) {
  const cut = Math.min(Math.max(Math.floor(text.length * 0.55), 18), text.length);
  const visible = text.slice(0, cut).trimEnd();
  return (
    <>
      {visible}
      <span aria-hidden="true" className="select-none blur-[3px]">
        {" "}
        ●●●● ●●●●●●● ●●●●●
      </span>
    </>
  );
}

export default async function MatchReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    area?: string;
    beds?: string;
    type?: string;
    band?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const input = parseInput(params);
  const report = input ? await runMatchReport(input) : null;

  const initial: ReportFormInitial = {
    areaId: params.area,
    beds: Number(params.beds) || undefined,
    type: params.type,
    band: params.band,
  };

  return (
    <>
      <section className="border-b border-hairline bg-soft py-14 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-deep">
            The Match Report
          </p>
          <h1 className="display-lg mt-3">
            Who&apos;s already looking for a home like{" "}
            <Scribble>yours</Scribble>?
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-charcoal-soft">
            Four details. No account, no card, no address. See how many
            registered Quiet Seekers your home matches, right now.
          </p>
          <div className="mt-8">
            <MatchReportForm initial={initial} />
          </div>
        </Container>
      </section>

      {report && (
        <section className="py-14 sm:py-20" aria-live="polite">
          <Container className="max-w-3xl">
            {report.count > 0 ? (
              <>
                <h2 className="text-3xl">
                  {report.count} Quiet Seeker{report.count === 1 ? "" : "s"}{" "}
                  match{report.count === 1 ? "es" : ""} your home in{" "}
                  {report.area.place}.
                </h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
                    <p className="font-display text-4xl font-bold text-charcoal">
                      {report.count}
                    </p>
                    <p className="mt-1 text-sm text-charcoal-soft">
                      registered buyer{report.count === 1 ? "" : "s"} whose
                      Quiet Seeker Profile your home fits
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
                    <p className="font-display text-4xl font-bold text-charcoal">
                      {report.cashOrNoChain}
                    </p>
                    <p className="mt-1 text-sm text-charcoal-soft">
                      can move without selling first
                    </p>
                  </div>
                  <div className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline">
                    {report.topPct !== null && (
                      <MatchRing pct={report.topPct} size="lg" animate countUp />
                    )}
                    <p className="text-sm text-charcoal-soft">
                      your single best match
                    </p>
                  </div>
                </div>

                {report.snippet && (
                  <figure className="mt-6 rounded-[var(--radius-lg)] bg-blue-tint/60 p-6 ring-1 ring-blue-deep/20">
                    <blockquote className="font-display text-lg font-semibold text-charcoal">
                      &ldquo;
                      <ObscuredHeadline text={report.snippet.headline} />
                      &rdquo;
                    </blockquote>
                    <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-charcoal-soft">
                      <span>{report.snippet.positionLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-blue-text">
                        {report.snippet.pct}% match with your home
                      </span>
                    </figcaption>
                  </figure>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <ButtonLink href="/join?as=seller">
                    {report.count === 1
                      ? "Create your free account to read the full profile"
                      : `Create your free account to read all ${report.count} profiles`}
                  </ButtonLink>
                  <ButtonLink href="/hush-homes" variant="secondary">
                    How listing works
                  </ButtonLink>
                </div>
                <p className="mt-5 flex max-w-2xl items-start gap-2 text-xs leading-relaxed text-charcoal-soft">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-deep" />
                  <span>
                    A Match % measures buyer appetite against your four
                    answers. It is never a valuation, and nothing about your
                    home has been shown to anyone. Buyers stay anonymised
                    until you choose to be introduced.
                  </span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl">
                  No Quiet Seekers match your home in {report.area.place} yet.
                </h2>
                <p className="mt-3 max-w-2xl text-charcoal-soft">
                  {report.regionCount > 0 ? (
                    <>
                      <strong className="text-charcoal">
                        {report.regionCount} are looking across{" "}
                        {report.regionLabel}
                      </strong>{" "}
                      right now, just not for this combination.{" "}
                    </>
                  ) : null}
                  We&apos;ll email you the moment one matches. It&apos;s free
                  to be first in the queue, and we never fabricate a count.
                </p>

                {params.saved === "1" ? (
                  <p className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl bg-green-tint p-4 text-sm font-medium text-green-deep">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    You&apos;re in the queue. The moment a Quiet Seeker matches
                    this home, you&apos;ll hear from us.
                  </p>
                ) : (
                  <form
                    action={captureMatchReportLead}
                    className="mt-6 max-w-xl"
                  >
                    <input type="hidden" name="area" value={input!.areaId} />
                    <input type="hidden" name="beds" value={input!.beds} />
                    <input type="hidden" name="type" value={input!.type} />
                    <input type="hidden" name="band" value={input!.band} />
                    <label
                      htmlFor="mr-email"
                      className="block text-sm font-semibold text-charcoal"
                    >
                      Email me when a buyer matches
                    </label>
                    <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                      <div className="flex flex-1 items-center gap-2 rounded-xl border border-hairline bg-white px-3.5 focus-within:border-blue-deep">
                        <Mail className="h-4 w-4 shrink-0 text-charcoal-soft" />
                        <input
                          id="mr-email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="min-h-12 w-full bg-transparent text-base placeholder:text-muted"
                        />
                      </div>
                      <SubmitButton
                        className="sm:shrink-0"
                        pendingLabel="Adding you to the queue…"
                      >
                        Keep me posted
                      </SubmitButton>
                    </div>
                    {params.error === "email" && (
                      <p className="mt-2 text-sm font-medium text-red-deep">
                        That email address doesn&apos;t look right. Try again?
                      </p>
                    )}
                    <p className="mt-2 text-xs text-charcoal-soft">
                      One email when a match appears. No newsletter, no
                      selling your address on.
                    </p>
                  </form>
                )}
              </>
            )}
          </Container>
        </section>
      )}
    </>
  );
}
