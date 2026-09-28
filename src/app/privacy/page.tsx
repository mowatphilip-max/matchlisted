import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy"
      intro="What personal information Matchlisted holds, why, and your rights over it."
    >
      <p>
        The full privacy notice is being prepared for launch. It will set
        out: what we collect when you create an account, list a home or
        register a Quiet Seeker Profile; the identity checks the law requires us to run and
        who runs them; how long we keep what; who we share it with (surveyors
        instructed on your behalf, the solicitors you appoint, our payment
        provider); and how to exercise your rights, including erasure.
      </p>
      <p>
        Two things are true today and will stay true: a Quiet Seeker&apos;s
        identity is never shown publicly, and neither side of an Introduction
        learns who the other is until both have agreed.
      </p>
    </PolicyPage>
  );
}
