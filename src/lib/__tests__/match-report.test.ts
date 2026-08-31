// The public Match Report (BUILD-BRIEF.md §6.1) — engine and empty-state
// lead capture, run against the real dev Supabase project like the other
// suites. The §3 gate points the other way here: the report tells a SELLER
// about matching BUYERS and must never fabricate a count.

import { afterAll, describe, expect, it } from "vitest";
import { runMatchReport } from "../match-report";
import { createMatchReportLead } from "../db";
import { serverDb } from "../supabase";
import { CONFIG } from "../site";

const leadEmail = `test-mr-lead-${Date.now()}@demo.matchlisted.com`;

afterAll(async () => {
  await serverDb().from("match_report_leads").delete().eq("email", leadEmail);
});

describe("the public Match Report (§6.1)", () => {
  it("reports honestly for a real area", async () => {
    const report = await runMatchReport({
      areaId: "east-lothian/gullane",
      beds: 4,
      type: "detached",
      band: "600-900",
    });
    expect(report).toBeTruthy();
    expect(report!.area.place).toBe("Gullane");
    expect(report!.count).toBeGreaterThanOrEqual(0);
    expect(report!.cashOrNoChain).toBeLessThanOrEqual(report!.count);
    if (report!.count > 0) {
      // Anything counted is at least "worth a look"; the top match leads.
      expect(report!.topPct).toBeGreaterThanOrEqual(
        CONFIG.matchBands.worthALook,
      );
      expect(report!.snippet?.pct).toBe(report!.topPct);
    } else {
      expect(report!.topPct).toBeNull();
      expect(report!.snippet).toBeNull();
    }
  });

  it("refuses nonsense inputs rather than fabricating a count", async () => {
    expect(
      await runMatchReport({
        areaId: "nowhere/void",
        beds: 3,
        type: "detached",
        band: "250-400",
      }),
    ).toBeNull();
    expect(
      await runMatchReport({
        areaId: "east-lothian/gullane",
        beds: 0,
        type: "detached",
        band: "250-400",
      }),
    ).toBeNull();
  });

  it("stores an empty-state lead with the four inputs", async () => {
    await createMatchReportLead({
      email: leadEmail,
      areaId: "east-lothian/gullane",
      town: "Gullane",
      beds: 4,
      propertyType: "detached",
      valueBand: "600-900",
    });
    const { data } = await serverDb()
      .from("match_report_leads")
      .select("*")
      .eq("email", leadEmail)
      .maybeSingle();
    expect(data).toBeTruthy();
    expect(data!.area_id).toBe("east-lothian/gullane");
    expect(data!.beds).toBe(4);
    expect(data!.alerted_at).toBeNull();
  });
});
