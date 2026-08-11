import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { HomeForm } from "@/components/home-form";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "List a Hush Home" };

export default async function NewHomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

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
        <div className="mt-10">
          <HomeForm home={null} />
        </div>
      </div>
    </Container>
  );
}
