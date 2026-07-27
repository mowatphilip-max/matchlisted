// Home Report download.
//
// The document contains the full address, the surveyor's valuation and
// details about the seller, so it is never publicly reachable. The file
// lives in a private bucket; this route checks permission on every single
// request and only then mints a signed link that expires in two minutes.
//
// Allowed: registered (contract-signed) Quiet Seekers, the home's own
// seller, and admin. Everyone else gets 403 — including signed-in users
// who haven't completed their brief.

import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { getBrief, getHome } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { signedHomeReportUrl } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  const { id } = await params;
  const home = await getHome(id);
  if (!home || home.homeReport.status !== "verified") notFound();

  const isSeller = user?.id === home.sellerId;
  const registered = user ? Boolean((await getBrief(user.id))?.contract) : false;
  if (!user || (!registered && !isSeller && !user.isAdmin)) {
    return new NextResponse(
      "Home Reports are available to registered Quiet Seekers only.",
      { status: 403 },
    );
  }

  const path = home.homeReport.storagePath;
  if (!path) {
    // Verified but no stored document — a data problem worth shouting about
    // rather than quietly serving nothing.
    console.error(`home ${home.id}: report verified but no file stored`);
    return new NextResponse(
      "That Home Report isn't available to download yet. Please contact us.",
      { status: 404 },
    );
  }

  const url = await signedHomeReportUrl(path);
  if (!url) {
    return new NextResponse("Could not prepare that download. Try again.", {
      status: 503,
    });
  }

  // Redirect to the short-lived signed link rather than proxying the file:
  // the link dies in two minutes and cannot be shared usefully.
  return NextResponse.redirect(url);
}
