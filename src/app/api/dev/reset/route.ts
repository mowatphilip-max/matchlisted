// Dev helper: reseed the in-memory store from sample-data without a server
// restart. Handy after editing sample data (hot reload keeps the old store
// alive via globalThis).
//
// LOCAL DEVELOPMENT ONLY — this wipes all data, so it 404s anywhere else.

import { NextResponse } from "next/server";
import { resetStore } from "@/lib/db";
import { requireDevEnvironment } from "@/lib/dev-only";

export const dynamic = "force-dynamic";

export function GET() {
  requireDevEnvironment();
  resetStore();
  return NextResponse.json({ ok: true, reseeded: true });
}
