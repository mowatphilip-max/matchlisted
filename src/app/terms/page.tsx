import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of use"
      intro="The agreement between you and Matchlisted when you use this site, list a Hush Home, or register as a Quiet Seeker."
    >
      <p>
        The full terms are being prepared for launch. They will cover, in
        plain language: what listing a Hush Home commits you to and what it
        costs; what registering as a Quiet Seeker commits you to; when the
        Home Report charge becomes payable and how it is collected; your
        14-day right to cancel; and how a Note of Offer differs from the
        binding offer your solicitor makes.
      </p>
      <p>
        Until then, the fee schedule shown on the site and the agreements you
        sign at listing or registration are the operative terms.
      </p>
    </PolicyPage>
  );
}
