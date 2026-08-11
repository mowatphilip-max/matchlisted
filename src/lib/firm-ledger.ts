// The firm ledger's one entry point today: pack delivery.
//
// DECISIONS.md §6A — the case preparation fee is the ONLY per-case money
// Matchlisted may take from a panel firm, and only as a genuine service
// (file opening, AML on both sides, chasing the Home Report, taking
// instructions). The rules that keep it legal under LSS rule D9.2:
//
//   1. The trigger is pack_delivered, NEVER missives_concluded. A fee
//      payable on completion is transaction commission however labelled.
//   2. Never refundable on fall-through. Contingency makes it commission.
//   3. Every delivery is logged in the audit trail.
//
// No UI calls this yet — the handoff-pack flow is Phase 5 — but the ledger
// rule exists in exactly one place so Phase 5 cannot get it wrong.

import { audit, createFirmInvoice, getPanelFirm } from "./db";
import { CONFIG, VAT_RATE } from "./site";
import type { FirmInvoice } from "./types";

/**
 * Record that a case pack was delivered to a panel firm for a listing, and
 * raise the £150 + VAT case pack fee on the firm ledger. Due immediately:
 * the service (the pack) has been rendered; there is no consumer-style
 * notice period because the payer is a business, not a consumer.
 */
export async function recordPackDelivered(
  firmId: string,
  listingId: string,
  actorId: string | null,
): Promise<FirmInvoice> {
  const firm = await getPanelFirm(firmId);
  if (!firm) throw new Error(`recordPackDelivered: no panel firm ${firmId}`);

  const net = CONFIG.fees.casePackFeeNet;
  const vat = Math.round(net * VAT_RATE * 100) / 100;
  const now = new Date().toISOString();

  const invoice = await createFirmInvoice({
    firmId: firm.id,
    kind: "case_pack_fee",
    listingId,
    netAmount: net,
    vatAmount: vat,
    grossAmount: net + vat,
    status: "due",
    dueAt: now,
    notes:
      "Case preparation fee, triggered by pack delivery. Not refundable on fall-through (DECISIONS.md §6A).",
  });

  await audit(actorId, "pack.delivered", "listing", listingId, {
    firmId: firm.id,
    firmName: firm.name,
    firmInvoiceId: invoice.id,
    gross: invoice.grossAmount,
  });

  return invoice;
}
