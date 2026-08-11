// Tripwires for DECISIONS.md §§2, 3, 6 (10–11 Aug 2026).
//
// Like legal-gate.test.ts this runs against the real dev Supabase project
// (.env.local). The DB-level tests assert the schema itself now refuses the
// abolished money shapes — a regression can't sneak back in via raw SQL any
// more than via the app. Fixtures are created and removed per run; the few
// audit rows the fixtures generate are removed too (dev DB pragmatism,
// scoped to exactly the ids this run created).

import { afterAll, describe, expect, it } from "vitest";
import { serverDb } from "../supabase";
import { createPanelFirm } from "../db";
import { recordPackDelivered } from "../firm-ledger";
import { CONFIG, exVat, withVat } from "../site";

const run = Date.now();
let firmId: string | undefined;
let packInvoiceId: string | undefined;
let listingId: string | undefined;

afterAll(async () => {
  const db = serverDb();
  if (firmId) {
    await db.from("firm_invoices").delete().eq("firm_id", firmId);
    await db.from("panel_firms").delete().eq("id", firmId);
    await db
      .from("audit_log")
      .delete()
      .in("subject_id", [firmId, packInvoiceId ?? firmId]);
  }
  if (listingId) {
    await db
      .from("audit_log")
      .delete()
      .eq("action", "pack.delivered")
      .eq("subject_id", listingId);
  }
});

describe("VAT-inclusive pricing (§1 condition 3, §2)", () => {
  it("derives ledger nets from the gross config figures", () => {
    expect(exVat(CONFIG.fees.homeReportGross)).toBe(483.33);
    expect(exVat(CONFIG.fees.buyerFeeGross)).toBe(300);
    expect(exVat(CONFIG.fees.rightmoveAddonGross)).toBe(200);
    expect(exVat(CONFIG.fees.photographyAddonGross)).toBe(295);
    expect(exVat(CONFIG.fees.boardAddonGross)).toBe(100);
  });

  it("round-trips gross -> net -> gross to the penny", () => {
    for (const gross of [
      CONFIG.fees.homeReportGross,
      CONFIG.fees.buyerFeeGross,
      CONFIG.fees.rightmoveAddonGross,
      CONFIG.fees.photographyAddonGross,
      CONFIG.fees.boardAddonGross,
    ]) {
      expect(Math.abs(withVat(exVat(gross)) - gross)).toBeLessThan(0.01);
    }
  });
});

describe("abolished charge types stay abolished (§3, §6)", () => {
  for (const abolished of ["withdrawal_fee", "conveyancing_commission"]) {
    it(`the charges table refuses type '${abolished}'`, async () => {
      const { error } = await serverDb().from("charges").insert({
        subject_type: "listing",
        subject_id: crypto.randomUUID(),
        payer_user_id: crypto.randomUUID(),
        type: abolished,
        net_amount: 1,
        vat_amount: 0,
        gross_amount: 1,
        status: "pending",
      });
      expect(error).toBeTruthy();
      expect(error?.message).toMatch(/invalid input value for enum/i);
    });
  }
});

describe("the firm ledger (§6)", () => {
  it("records a pack delivery as a £150 + VAT case pack fee, due immediately", async () => {
    const { data: home } = await serverDb()
      .from("hush_homes")
      .select("id")
      .limit(1)
      .maybeSingle();
    expect(home).toBeTruthy();
    listingId = home!.id;

    const firm = await createPanelFirm({
      name: `test-decisions-firm-${run}`,
      territory: "Test Lothian",
      seatFeeAnnual: 12000,
      invoicingSchedule: "monthly",
      renewalDate: "2027-08-11",
      active: true,
    });
    firmId = firm.id;

    const invoice = await recordPackDelivered(firm.id, listingId!, null);
    packInvoiceId = invoice.id;

    expect(invoice.kind).toBe("case_pack_fee");
    expect(invoice.netAmount).toBe(CONFIG.fees.casePackFeeNet);
    expect(invoice.vatAmount).toBe(30);
    expect(invoice.grossAmount).toBe(180);
    expect(invoice.status).toBe("due");
    expect(invoice.dueAt).toBeTruthy();
    expect(invoice.listingId).toBe(listingId);
  });

  it("refuses a panel_seat row attached to a listing", async () => {
    expect(firmId).toBeTruthy();
    const { error } = await serverDb().from("firm_invoices").insert({
      firm_id: firmId,
      kind: "panel_seat",
      listing_id: listingId,
      net_amount: 1000,
      vat_amount: 200,
      gross_amount: 1200,
      status: "due",
    });
    expect(error).toBeTruthy();
    expect(error?.message).toMatch(/firm_invoices_pack_needs_listing/i);
  });
});
