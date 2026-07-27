import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { HomeForm } from "@/components/home-form";
import { currentUser } from "@/lib/session";
import { getHome } from "@/lib/db";

export const metadata: Metadata = { title: "Edit my Hush Home" };

export default async function EditHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const home = await getHome(id);
  if (!home || home.sellerId !== user.id) notFound();

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl">Edit {home.headline}</h1>
        <div className="mt-10">
          <HomeForm home={home} />
        </div>
      </div>
    </Container>
  );
}
