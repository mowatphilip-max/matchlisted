// What happens once a Home Report is genuinely paid for.
//
// Called ONLY from the Stripe webhook (or the local demo checkout). Never
// from a page the customer lands on — anyone can visit a success URL, but
// only Stripe can sign a webhook.
//
// Safe to call twice: if the invoice is already paid it returns quietly, so
// a retried webhook can't instruct two surveys or raise two purchase orders.

import {
  adminUserId,
  getHomeUnscoped,
  getInvoice,
  getUser,
  nextPurchaseOrderRef,
  pushNotification,
  recordEmail,
  upsertHome,
  upsertInvoice,
  upsertPurchaseOrder,
} from "./db";
import { areaLabel } from "./areas";
import { HOME_REPORT_SUPPLIERS, SITE_NAME, homeReportQuote } from "./site";
import type { PurchaseOrder } from "./types";

export async function fulfilHomeReportOrder(
  invoiceId: string,
  paymentRef?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) return { ok: false, reason: "invoice not found" };

  // Already done — a retry, not a second order.
  if (invoice.status === "paid") return { ok: true, reason: "already fulfilled" };

  const home = invoice.homeId ? await getHomeUnscoped(invoice.homeId) : undefined;
  const user = await getUser(invoice.userId);
  if (!home || !user) return { ok: false, reason: "home or buyer missing" };

  const supplier = HOME_REPORT_SUPPLIERS.find(
    (s) => s.id === home.homeReport.supplier,
  );
  const quote = supplier ? homeReportQuote(supplier.id, home.price) : null;
  if (!supplier || !quote) return { ok: false, reason: "supplier or quote missing" };

  const now = new Date().toISOString();

  invoice.status = "paid";
  invoice.paidAt = now;
  if (paymentRef) invoice.stripePaymentIntent = paymentRef;
  await upsertInvoice(invoice);

  // Raise the purchase order: the owner has paid US; the surveyor does the
  // job and bills US against this number.
  const po: PurchaseOrder = {
    id: await nextPurchaseOrderRef(),
    homeId: home.id,
    sellerId: user.id,
    supplier: supplier.id,
    estimatedValue: home.price,
    base: quote.base,
    vat: quote.vat,
    margin: quote.margin,
    total: quote.total,
    invoiceId: invoice.id,
    status: "instructed",
    createdAt: now,
  };
  await upsertPurchaseOrder(po);

  home.homeReport = {
    ...home.homeReport,
    status: "ordered",
    orderedAt: now,
    poId: po.id,
  };
  await upsertHome(home);

  const address = `${home.addressLine || home.headline}, ${areaLabel(home.areaId)}`;

  // 1) Instruct the surveyor.
  await recordEmail({
    to: supplier.email,
    subject: `HOME REPORT INSTRUCTION: ${po.id} · ${address}`,
    body: [
      `Purchase order: ${po.id}`,
      "",
      `Please carry out a Home Report for the following property. This instruction is CONFIRMED and PAID on our side. Invoice ${SITE_NAME} (quoting ${po.id}) for your fee of £${po.base} + VAT.`,
      "",
      `Property address: ${address}`,
      `Owner's estimate of value: £${po.estimatedValue.toLocaleString("en-GB")}`,
      "",
      `Owner: ${user.name}`,
      `Owner email: ${user.email}`,
      `Owner phone: ${user.phone ?? "not supplied"}`,
      "",
      "Please contact the owner directly to arrange access and timings, and send the completed Home Report to both the owner and ourselves.",
      "",
      `${SITE_NAME}`,
    ].join("\n"),
  });

  // 2) Tell the owner their surveyor is instructed.
  await pushNotification({
    userId: user.id,
    kind: "system",
    title: "Your Home Report is booked",
    body: `${supplier.name} have been instructed (ref ${po.id}) and will be in touch to arrange the visit.`,
    href: `/dashboard/home/${home.id}`,
  });
  await recordEmail({
    to: user.email,
    subject: `Your Home Report is booked and ${supplier.name} will be in touch`,
    body: [
      `Hello ${user.name.split(" ")[0]},`,
      "",
      `Good news: your Home Report for ${address} is booked and paid.`,
      "",
      `We have instructed ${supplier.name} (our reference ${po.id}). They will contact you directly on ${user.phone ?? user.email} to arrange a convenient time to visit the property.`,
      "",
      "Once the completed report is uploaded and verified, your Hush Home goes fully live on the Matchlist: photos unblurred, report downloadable by registered Quiet Seekers, and possible-match alerts sent.",
      "",
      `${SITE_NAME}`,
    ].join("\n"),
  });

  // 3) Receipt.
  await recordEmail({
    to: user.email,
    subject: `Receipt: Home Report payment (${po.id})`,
    body: [
      `Hello ${user.name.split(" ")[0]},`,
      "",
      "Thank you for your payment. Your receipt:",
      "",
      `  Home Report (${supplier.name})       £${po.base.toFixed(2)}`,
      `  VAT (20%)                            £${po.vat.toFixed(2)}`,
      `  ${SITE_NAME} arrangement fee          £${po.margin.toFixed(2)}`,
      "  --------------------------------------------",
      `  Total paid                           £${po.total.toFixed(2)}`,
      "",
      `Property: ${address}`,
      `Reference: ${po.id}`,
      `Date: ${new Date().toLocaleDateString("en-GB")}`,
      "",
      `${SITE_NAME}`,
    ].join("\n"),
  });

  // 4) Tell the back office there's a job running.
  const adminId = await adminUserId();
  if (adminId) {
    await pushNotification({
      userId: adminId,
      kind: "system",
      title: `Home Report paid · ${po.id}`,
      body: `${user.name} paid £${po.total.toFixed(2)} for ${address}. ${supplier.name} instructed.`,
      href: "/admin/orders",
    });
  }

  return { ok: true };
}

/** A refund came back from Stripe — record it and flag it for the team. */
export async function recordRefund(
  invoiceId: string,
  amountPounds: number,
): Promise<void> {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) return;
  invoice.refundedAt = new Date().toISOString();
  invoice.refundAmount = amountPounds;
  await upsertInvoice(invoice);

  const adminId = await adminUserId();
  if (adminId) {
    await pushNotification({
      userId: adminId,
      kind: "system",
      title: "Refund issued",
      body: `£${amountPounds.toFixed(2)} refunded on ${invoice.description}. If a surveyor was already instructed, cancel it with them.`,
      href: "/admin/invoices",
    });
  }
}
