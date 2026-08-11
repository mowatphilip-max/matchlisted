import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <PolicyPage
      title="Cookies"
      intro="What this site stores on your device, and what it never does."
    >
      <p>
        Matchlisted currently sets only what sign-in requires: the session
        token that keeps you logged in (essential, set by our authentication
        provider) and a small local preference remembering the area you last
        searched. There is no advertising, no cross-site tracking, and no
        analytics cookie today.
      </p>
      <p>
        If that changes, non-essential cookies will be off until you choose
        to accept them, and this page will list every cookie by name, purpose
        and lifetime.
      </p>
    </PolicyPage>
  );
}
