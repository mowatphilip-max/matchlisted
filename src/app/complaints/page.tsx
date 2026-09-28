import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Complaints" };

export default function ComplaintsPage() {
  return (
    <PolicyPage
      title="Complaints"
      intro="If something has gone wrong, tell us. Here is how a complaint is handled."
    >
      <p>
        Email{" "}
        <a
          href="mailto:hello@matchlisted.com"
          className="text-blue-text underline"
        >
          hello@matchlisted.com
        </a>{" "}
        with &ldquo;Complaint&rdquo; in the subject line. We acknowledge
        within 3 working days and aim to give a full written response within
        15 working days.
      </p>
      <p>
        The formal complaints procedure, including escalation to an approved
        redress scheme once our membership is confirmed, is being finalised
        for launch and will be published here.
      </p>
    </PolicyPage>
  );
}
