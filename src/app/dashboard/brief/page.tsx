import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { BriefForm } from "@/components/brief-form";
import { currentUser } from "@/lib/session";
import { getBrief } from "@/lib/db";

export const metadata: Metadata = { title: "My Quiet Seeker brief" };

export default async function BriefPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const brief = getBrief(user.id) ?? null;

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-deep">
          Quiet Seeker
        </p>
        <h1 className="mt-2 text-3xl">
          {brief ? "Edit your brief" : "Tell the Matchlist what you're after"}
        </h1>
        <p className="mt-2 text-charcoal-soft">
          Every live Hush Home in Scotland is scored against this brief.
          The more honest it is, the better your matches.
        </p>
        <div className="mt-10">
          <BriefForm brief={brief} />
        </div>
      </div>
    </Container>
  );
}
