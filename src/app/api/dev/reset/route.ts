// Dev helper: reseed the in-memory store from sample-data without a server
// restart. Handy after editing sample data (hot reload keeps the old store
// alive via globalThis). No-op risk in production: the store is in-memory
// sample data by design in this prototype.

import { NextResponse } from "next/server";
import { resetStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  resetStore();
  return NextResponse.json({ ok: true, reseeded: true });
}
