// Translation between Postgres rows (snake_case, flat) and the app's types
// (camelCase, nested). Keeping this in one file means the rest of the app
// never has to know what the columns are called.

import type {
  AuditEntry,
  Charge,
  ContractSignature,
  HushHome,
  Introduction,
  Invoice,
  OutboxEmail,
  PurchaseOrder,
  SeekerBrief,
  User,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

// ---- Users / profiles -----------------------------------------------------

export function toUser(row: Row): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone ?? undefined,
    isAdmin: row.is_admin ?? false,
    createdAt: row.created_at,
    matchAlertPct: row.match_alert_pct ?? undefined,
  };
}

export function fromUser(user: User): Row {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    is_admin: user.isAdmin ?? false,
    match_alert_pct: user.matchAlertPct ?? null,
  };
}

// ---- Seeker briefs --------------------------------------------------------

function toContract(row: Row): ContractSignature | null {
  if (!row.contract_signed_at) return null;
  return {
    typedName: row.contract_typed_name ?? "",
    signedAt: row.contract_signed_at,
    ip: row.contract_ip ?? "",
    version: row.contract_version ?? "",
  };
}

export function toBrief(row: Row): SeekerBrief {
  return {
    userId: row.user_id,
    publicRef: row.public_ref ?? "",
    headline: row.headline ?? "",
    story: row.story ?? "",
    areas: row.areas ?? [],
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    minBeds: row.min_beds,
    minBaths: row.min_baths,
    garden: row.garden,
    types: row.types ?? [],
    features: row.features ?? [],
    position: row.position,
    notes: row.notes ?? undefined,
    contract: toContract(row),
    propertyTypes: row.property_types ?? [],
    readiness: row.readiness ?? [],
    vetted: row.vetted ?? false,
    budgetRangeMin: row.budget_range_min ?? null,
    budgetRangeMax: row.budget_range_max ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromBrief(brief: SeekerBrief): Row {
  return {
    user_id: brief.userId,
    public_ref: brief.publicRef || null,
    headline: brief.headline || null,
    story: brief.story || null,
    areas: brief.areas,
    budget_min: brief.budgetMin,
    budget_max: brief.budgetMax,
    min_beds: brief.minBeds,
    min_baths: brief.minBaths,
    garden: brief.garden,
    types: brief.types,
    features: brief.features,
    position: brief.position,
    notes: brief.notes ?? null,
    contract_typed_name: brief.contract?.typedName ?? null,
    contract_signed_at: brief.contract?.signedAt ?? null,
    contract_ip: brief.contract?.ip ?? null,
    contract_version: brief.contract?.version ?? null,
    property_types: brief.propertyTypes ?? [],
    readiness: brief.readiness ?? [],
    vetted: brief.vetted ?? false,
    budget_range_min: brief.budgetRangeMin ?? null,
    budget_range_max: brief.budgetRangeMax ?? null,
    updated_at: new Date().toISOString(),
  };
}

// ---- Hush Homes -----------------------------------------------------------

export function toHome(row: Row): HushHome {
  return {
    id: row.id,
    sellerId: row.seller_id,
    headline: row.headline,
    areaId: row.area_id,
    addressLine: row.address_line,
    price: row.price,
    beds: row.beds,
    baths: row.baths,
    type: row.type,
    garden: row.garden,
    features: row.features ?? [],
    description: row.description ?? "",
    photos: row.photos ?? [],
    floorPlan: row.floor_plan ?? null,
    homeReport: {
      status: row.report_status ?? "none",
      supplier: row.report_supplier ?? undefined,
      orderedAt: row.report_ordered_at ?? undefined,
      invoiceId: row.report_invoice_id ?? undefined,
      poId: row.home_report_po_id ?? undefined,
      fileName: row.report_file ?? undefined,
      storagePath: row.report_storage_path ?? undefined,
      uploadedAt: row.report_uploaded_at ?? undefined,
      verifiedAt: row.report_verified_at ?? undefined,
    },
    contract: toContract(row),
    status: row.status,
    ownerEstimate: row.owner_estimate ?? null,
    goLiveAt: row.go_live_at ?? null,
    expiresAt: row.expires_at ?? null,
    approvalStatus: row.approval_status ?? "pending",
    approvalNotes: row.approval_notes ?? null,
    previewListed: row.preview_listed ?? false,
    createdAt: row.created_at,
  };
}

export function fromHome(home: HushHome): Row {
  return {
    id: home.id,
    seller_id: home.sellerId,
    headline: home.headline,
    area_id: home.areaId,
    address_line: home.addressLine,
    price: home.price,
    beds: home.beds,
    baths: home.baths,
    type: home.type,
    garden: home.garden,
    features: home.features,
    description: home.description,
    photos: home.photos,
    floor_plan: home.floorPlan,
    report_status: home.homeReport.status,
    report_supplier: home.homeReport.supplier ?? null,
    report_ordered_at: home.homeReport.orderedAt ?? null,
    report_invoice_id: home.homeReport.invoiceId ?? null,
    home_report_po_id: home.homeReport.poId ?? null,
    report_file: home.homeReport.fileName ?? null,
    report_storage_path: home.homeReport.storagePath ?? null,
    report_uploaded_at: home.homeReport.uploadedAt ?? null,
    report_verified_at: home.homeReport.verifiedAt ?? null,
    contract_typed_name: home.contract?.typedName ?? null,
    contract_signed_at: home.contract?.signedAt ?? null,
    contract_ip: home.contract?.ip ?? null,
    contract_version: home.contract?.version ?? null,
    status: home.status,
    owner_estimate: home.ownerEstimate ?? null,
    go_live_at: home.goLiveAt ?? null,
    expires_at: home.expiresAt ?? null,
    approval_status: home.approvalStatus ?? "pending",
    approval_notes: home.approvalNotes ?? null,
    preview_listed: home.previewListed ?? false,
  };
}

// ---- Introductions --------------------------------------------------------

export function toIntroduction(row: Row): Introduction {
  return {
    id: row.id,
    seekerId: row.seeker_ref,
    sellerId: row.seller_id,
    homeId: row.home_id ?? null,
    status: row.status,
    createdAt: row.created_at,
    offeredAt: row.offered_at ?? undefined,
    respondedAt: row.responded_at ?? undefined,
  };
}

export function fromIntroduction(intro: Introduction): Row {
  return {
    id: intro.id,
    seeker_ref: intro.seekerId,
    seller_id: intro.sellerId,
    home_id: intro.homeId,
    status: intro.status,
    offered_at: intro.offeredAt ?? null,
    responded_at: intro.respondedAt ?? null,
  };
}

// ---- Purchase orders ------------------------------------------------------

export function toPurchaseOrder(row: Row): PurchaseOrder {
  return {
    id: row.id,
    homeId: row.home_id,
    sellerId: row.seller_id,
    supplier: row.supplier,
    estimatedValue: row.estimated_value,
    base: Number(row.base),
    vat: Number(row.vat),
    margin: Number(row.margin),
    total: Number(row.total),
    invoiceId: row.invoice_id,
    status: row.status,
    createdAt: row.created_at,
    billedAt: row.billed_at ?? undefined,
    settledAt: row.settled_at ?? undefined,
  };
}

export function fromPurchaseOrder(po: PurchaseOrder): Row {
  return {
    id: po.id,
    home_id: po.homeId,
    seller_id: po.sellerId,
    supplier: po.supplier,
    estimated_value: po.estimatedValue,
    base: po.base,
    vat: po.vat,
    margin: po.margin,
    total: po.total,
    invoice_id: po.invoiceId,
    status: po.status,
    billed_at: po.billedAt ?? null,
    settled_at: po.settledAt ?? null,
  };
}

// ---- Invoices -------------------------------------------------------------

export function toInvoice(row: Row): Invoice {
  return {
    id: row.id,
    userId: row.user_id,
    homeId: row.home_id ?? undefined,
    offerId: row.offer_id ?? undefined,
    lawyerId: row.lawyer_id ?? undefined,
    kind: row.kind,
    description: row.description,
    net: Number(row.net),
    vat: Number(row.vat),
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
    stripeCheckoutId: row.stripe_checkout_id ?? undefined,
    stripePaymentIntent: row.stripe_payment_intent ?? undefined,
    refundedAt: row.refunded_at ?? undefined,
    refundAmount: row.refund_amount != null ? Number(row.refund_amount) : undefined,
  };
}

export function fromInvoice(invoice: Invoice): Row {
  return {
    id: invoice.id,
    user_id: invoice.userId,
    home_id: invoice.homeId ?? null,
    offer_id: invoice.offerId ?? null,
    lawyer_id: invoice.lawyerId ?? null,
    kind: invoice.kind,
    description: invoice.description,
    net: invoice.net,
    vat: invoice.vat,
    status: invoice.status,
    paid_at: invoice.paidAt ?? null,
    stripe_checkout_id: invoice.stripeCheckoutId ?? null,
    stripe_payment_intent: invoice.stripePaymentIntent ?? null,
    refunded_at: invoice.refundedAt ?? null,
    refund_amount: invoice.refundAmount ?? null,
  };
}

// ---- Emails ---------------------------------------------------------------

export function toEmail(row: Row): OutboxEmail {
  return {
    id: row.id,
    to: row.to_address,
    subject: row.subject,
    body: row.body,
    createdAt: row.created_at,
  };
}

// ---- Charges (BUILD-BRIEF.md §4) ------------------------------------------

export function toCharge(row: Row): Charge {
  return {
    id: row.id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    payerUserId: row.payer_user_id,
    type: row.type,
    netAmount: Number(row.net_amount),
    vatAmount: Number(row.vat_amount),
    grossAmount: Number(row.gross_amount),
    status: row.status,
    trigger: row.trigger ?? undefined,
    dueAt: row.due_at ?? undefined,
    collectionRoute: row.collection_route ?? undefined,
    stripePaymentIntent: row.stripe_payment_intent ?? undefined,
    mandateId: row.mandate_id ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromCharge(charge: Charge): Row {
  return {
    id: charge.id,
    subject_type: charge.subjectType,
    subject_id: charge.subjectId,
    payer_user_id: charge.payerUserId,
    type: charge.type,
    net_amount: charge.netAmount,
    vat_amount: charge.vatAmount,
    gross_amount: charge.grossAmount,
    status: charge.status,
    trigger: charge.trigger ?? null,
    due_at: charge.dueAt ?? null,
    collection_route: charge.collectionRoute ?? null,
    stripe_payment_intent: charge.stripePaymentIntent ?? null,
    mandate_id: charge.mandateId ?? null,
    notes: charge.notes ?? null,
    updated_at: charge.updatedAt,
  };
}

// ---- Audit log ------------------------------------------------------------

export function toAuditEntry(row: Row): AuditEntry {
  return {
    id: row.id,
    actorId: row.actor_id ?? null,
    action: row.action,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    meta: row.meta ?? {},
    at: row.at,
  };
}
