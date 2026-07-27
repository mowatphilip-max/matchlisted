// Home Report download — gated to registered (contract-signed) Quiet Seekers,
// the seller, and admin. The prototype serves a placeholder document; in
// production this streams the uploaded PDF from private Supabase Storage.

import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { getBrief, getHome } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { HOME_REPORT_SUPPLIERS } from "@/lib/site";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  const { id } = await params;
  const home = await getHome(id);
  if (!home || home.homeReport.status !== "verified") notFound();

  const isSeller = user?.id === home.sellerId;
  const registered = user ? Boolean(await (await getBrief(user.id))?.contract) : false;
  if (!user || (!registered && !isSeller && !user.isAdmin)) {
    return new NextResponse(
      "Home Reports are available to registered Quiet Seekers only.",
      { status: 403 },
    );
  }

  const body = [
    "MATCHLISTED — HOME REPORT (PROTOTYPE PLACEHOLDER)",
    "",
    `Property: ${home.headline}`,
    `File: ${home.homeReport.fileName ?? "home-report.pdf"}`,
    `Surveyor: ${HOME_REPORT_SUPPLIERS.find((s) => s.id === home.homeReport.supplier)?.name ?? "TBC"}`,
    `Verified: ${home.homeReport.verifiedAt ?? ""}`,
    "",
    "In production this endpoint streams the genuine uploaded PDF from",
    "private storage, still gated to registered Quiet Seekers.",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${home.homeReport.fileName ?? "home-report.txt"}"`,
    },
  });
}
