import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { LEGAL } from "@/lib/site";

/**
 * Shared frame for the compliance pages (BUILD-BRIEF.md §9). The pages ship
 * as honest scaffolds: structure and known facts now, solicitor-approved
 * text dropped in when it arrives. Nothing here invents a legal claim.
 */
export function PolicyPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children?: ReactNode;
}) {
  return (
    <Container className="py-16">
      {/* 68ch, not a Tailwind width: the measure is the point. max-w-2xl (672px)
          ran the text-sm body copy to ~96 characters a line, well past the
          45–75 band. */}
      <div className="mx-auto max-w-[68ch]">
        <h1 className="text-3xl">{title}</h1>
        <p className="mt-3 text-charcoal-soft">{intro}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-charcoal">
          {children}
        </div>
        <p className="mt-10 rounded-2xl bg-soft p-5 text-sm text-charcoal-soft">
          This page is being finalised with our solicitors ahead of launch.
          Questions in the meantime:{" "}
          <a
            href="mailto:hello@matchlisted.com"
            className="text-blue-text underline"
          >
            hello@matchlisted.com
          </a>
          . {LEGAL.companyName}
          {LEGAL.companyNumber ? `, company number ${LEGAL.companyNumber}` : ""}.
        </p>
      </div>
    </Container>
  );
}
