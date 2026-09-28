import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { HomeForm } from "@/components/home-form";
import { currentUser } from "@/lib/session";
import { Alert } from "@/components/ui/alert";
import { SELLER_HOME_MESSAGES, messageFor } from "@/lib/page-messages";

export const metadata: Metadata = { title: "List a Hush Home" };

export default async function NewHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  // saveHomeListing redirects here with ?error=invalid when a required field
  // is missing. Without this the seller landed back on an empty form with no
  // explanation at all.
  const { error } = await searchParams;
  const message = messageFor(SELLER_HOME_MESSAGES, error);

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wider text-orange-deep">
          Hush Home · no listing fee
        </p>
        <h1 className="mt-2 text-3xl">Build your home&apos;s profile</h1>
        <p className="mt-2 text-charcoal-soft">
          Three steps to live: build the profile, sign the seller agreement,
          and complete a Home Report. You&apos;ll see anonymised matching
          seekers as soon as the profile is saved.
        </p>
        {message && (
          <Alert className="mt-6" tone={message.tone} title={message.title}>
            {message.body}
          </Alert>
        )}
        <div className="mt-10">
          <HomeForm home={null} />
        </div>
      </div>
    </Container>
  );
}
