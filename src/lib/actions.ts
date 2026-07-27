"use server";

// All server actions. Guards are light (prototype), but every mutation checks
// the session and ownership. Payments are simulated: an Invoice is created as
// "due", the demo checkout at /pay/[invoiceId] marks it paid — the seam where
// Stripe Checkout slots in for production.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  addSlot,
  createUser,
  findIntroduction,
  getBrief,
  getBriefByPublicRef,
  getHome,
  getIntroduction,
  getInvoice,
  getPurchaseOrder,
  recordEmail,
  upsertPurchaseOrder,
  getLawyer,
  getOffer,
  getSlot,
  getUser,
  getUserByEmail,
  getViewing,
  homesBySeller,
  invoicesForUser,
  matchWeights,
  newId,
  pushNotification,
  removeLawyer as dbRemoveLawyer,
  removeSlot,
  setMatchWeights,
  toggleSaved,
  upsertBrief,
  upsertHome,
  upsertIntroduction,
  upsertInvoice,
  upsertLawyer,
  upsertOffer,
  upsertViewing,
  markNotificationsRead,
} from "./db";
import { alertSeekersAboutHome, alertSellersAboutBrief } from "./alerts";
import { areaLabel } from "./areas";
import { clearSession, currentUser, setSessionUser } from "./session";
import {
  CONTRACT_VERSIONS,
  CONVEYANCING_DEPOSIT,
  HOME_REPORT_SUPPLIERS,
  SITE_NAME,
  VAT_RATE,
  homeReportQuote,
  sourcingFee,
} from "./site";
import type { SeekerPropertyType } from "./mowatt-seekers";
import type {
  BuyingPosition,
  ContractSignature,
  FeatureTag,
  GardenPreference,
  HushHome,
  Introduction,
  Invoice,
  PropertyType,
  PurchaseOrder,
  SeekerBrief,
} from "./types";

async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/dashboard");
  return user;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

async function makeSignature(
  typedName: string,
  version: string,
): Promise<ContractSignature> {
  return {
    typedName: typedName.trim(),
    signedAt: new Date().toISOString(),
    ip: await clientIp(),
    version,
  };
}

function refresh() {
  revalidatePath("/", "layout");
}

// ---- Auth -----------------------------------------------------------------

export async function demoSignIn(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const user = getUser(userId);
  if (!user || !user.email.endsWith("@demo.matchlisted.com")) {
    redirect("/login?error=unknown");
  }
  await setSessionUser(user.id);
  refresh();
  redirect(user.isAdmin ? "/admin" : "/dashboard");
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const user = email ? getUserByEmail(email) : undefined;
  if (!user) redirect("/login?error=notfound");
  await setSessionUser(user.id);
  refresh();
  redirect(user.isAdmin ? "/admin" : "/dashboard");
}

export async function register(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const intent = String(formData.get("intent") ?? "seeker");
  const seekerRef = String(formData.get("seeker") ?? "").trim();
  if (!name || !email.includes("@")) {
    redirect(
      seekerRef
        ? `/join?as=seller&seeker=${encodeURIComponent(seekerRef)}&error=invalid`
        : "/join?error=invalid",
    );
  }
  if (getUserByEmail(email)) redirect("/login?error=exists");
  const user = createUser({ name, email });
  await setSessionUser(user.id);

  // Arrived via a Quiet Seeker's public profile: record the interest now,
  // so the introduction pipeline starts the moment the account exists.
  const target = seekerRef ? getBriefByPublicRef(seekerRef) : undefined;
  if (target?.contract && target.userId !== user.id) {
    recordInterest(target.userId, user.id, null);
    refresh();
    redirect(`/dashboard/home/new?seeker=${encodeURIComponent(seekerRef)}`);
  }
  if (seekerRef && !target) {
    const { findMowattSeeker } = await import("./mowatt-bridge");
    const mowatt = await findMowattSeeker(seekerRef);
    if (mowatt?.active) {
      recordInterest(`mowatt:${seekerRef}`, user.id, null);
      refresh();
      redirect(`/dashboard/home/new?seeker=${encodeURIComponent(seekerRef)}`);
    }
  }

  refresh();
  redirect(intent === "seller" ? "/dashboard/home/new" : "/dashboard/brief");
}

export async function signOut() {
  await clearSession();
  refresh();
  redirect("/");
}

// ---- Quiet Seeker brief ---------------------------------------------------

export async function saveBrief(formData: FormData) {
  const user = await requireUser();
  const existing = getBrief(user.id);
  const now = new Date().toISOString();

  const areas = JSON.parse(String(formData.get("areas") ?? "[]")) as string[];
  const types = formData.getAll("types").map(String) as PropertyType[];
  const features = formData.getAll("features").map(String) as FeatureTag[];

  const headline = String(formData.get("headline") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();

  // Property-type picker (multi-select from the closed set). Skipped = []
  // = "open to any" — the card renders the 'any' icon, never an empty tile.
  const { SEEKER_PROPERTY_TYPES } = await import("./mowatt-seekers");
  const validTypes = new Set<string>(SEEKER_PROPERTY_TYPES.map((t) => t.key));
  let propertyTypes: SeekerPropertyType[] = [];
  try {
    const raw: unknown = JSON.parse(String(formData.get("propertyTypes") ?? "[]"));
    if (Array.isArray(raw)) {
      propertyTypes = raw.filter(
        (t): t is SeekerPropertyType =>
          typeof t === "string" && validTypes.has(t) && t !== "any",
      );
    }
  } catch {}

  const brief: SeekerBrief = {
    userId: user.id,
    // Public anonymised profile. The ref is stable for the brief's life;
    // headline/story fall back to something presentable if left blank.
    publicRef: existing?.publicRef ?? newId("QS"),
    headline: headline || existing?.headline || "Registered Quiet Seeker",
    story:
      story ||
      existing?.story ||
      "A registered buyer with a signed agreement, quietly looking through Matchlisted.",
    areas,
    budgetMin: Number(formData.get("budgetMin") ?? 50000),
    budgetMax: Number(formData.get("budgetMax") ?? 5000000),
    minBeds: Number(formData.get("minBeds") ?? 1),
    minBaths: Number(formData.get("minBaths") ?? 1),
    garden: (String(formData.get("garden")) as GardenPreference) || "no-preference",
    types,
    features,
    position:
      (String(formData.get("position")) as BuyingPosition) ||
      "cash-nothing-to-sell",
    notes: String(formData.get("notes") ?? "").trim() || undefined,
    contract: existing?.contract ?? null,
    propertyTypes,
    readiness: existing?.readiness ?? [],
    vetted: existing?.vetted ?? false,
    budgetRangeMin: existing?.budgetRangeMin ?? null,
    budgetRangeMax: existing?.budgetRangeMax ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  upsertBrief(brief);
  refresh();
  if (!brief.contract) redirect("/dashboard/brief/contract");
  redirect("/dashboard?saved=brief");
}

export async function signSeekerContract(formData: FormData) {
  const user = await requireUser();
  const typedName = String(formData.get("typedName") ?? "").trim();
  const agreed = formData.get("agree") === "on";
  const brief = getBrief(user.id);
  if (!brief) redirect("/dashboard/brief");
  if (!typedName || !agreed)
    redirect("/dashboard/brief/contract?error=incomplete");
  brief.contract = await makeSignature(typedName, CONTRACT_VERSIONS.seeker);
  brief.updatedAt = new Date().toISOString();
  upsertBrief(brief);
  // The brief just went live on the Matchlist: tell matching sellers.
  alertSellersAboutBrief(brief);
  refresh();
  redirect("/dashboard?signed=seeker");
}

// ---- Hush Home listing ----------------------------------------------------

export async function saveHomeListing(formData: FormData) {
  const user = await requireUser();
  const homeId = String(formData.get("homeId") ?? "");
  const existing = homeId ? getHome(homeId) : undefined;
  if (existing && existing.sellerId !== user.id) redirect("/dashboard");

  const features = formData.getAll("features").map(String) as FeatureTag[];
  const home: HushHome = {
    id: existing?.id ?? newId("h"),
    sellerId: user.id,
    headline: String(formData.get("headline") ?? "").trim(),
    areaId: String(formData.get("areaId") ?? ""),
    addressLine: String(formData.get("addressLine") ?? "").trim(),
    price: Number(formData.get("price") ?? 0),
    beds: Number(formData.get("beds") ?? 1),
    baths: Number(formData.get("baths") ?? 1),
    type: (String(formData.get("type")) as PropertyType) || "detached",
    garden: formData.get("garden") === "on",
    features,
    description: String(formData.get("description") ?? "").trim(),
    photos: existing?.photos ?? [],
    floorPlan: existing?.floorPlan ?? null,
    homeReport: existing?.homeReport ?? { status: "none" },
    contract: existing?.contract ?? null,
    status: existing?.status ?? "draft",
    // "I'll do the Home Report later" — preview listing until it's verified.
    previewListed: formData.get("previewLater") === "on",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  if (!home.headline || !home.areaId || !home.price) {
    redirect(existing ? `/dashboard/home/${home.id}?error=invalid` : "/dashboard/home/new?error=invalid");
  }
  upsertHome(home);
  refresh();
  redirect(`/dashboard/home/${home.id}`);
}

export async function signSellerContract(formData: FormData) {
  const user = await requireUser();
  const home = getHome(String(formData.get("homeId") ?? ""));
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const typedName = String(formData.get("typedName") ?? "").trim();
  const agreed = formData.get("agree") === "on";
  if (!typedName || !agreed)
    redirect(`/dashboard/home/${home.id}/contract?error=incomplete`);
  home.contract = await makeSignature(typedName, CONTRACT_VERSIONS.seller);
  upsertHome(home);
  refresh();
  redirect(`/dashboard/home/${home.id}`);
}

export async function orderHomeReport(formData: FormData) {
  const user = await requireUser();
  const home = getHome(String(formData.get("homeId") ?? ""));
  const supplierId = String(formData.get("supplier") ?? "");
  const supplier = HOME_REPORT_SUPPLIERS.find((s) => s.id === supplierId);
  if (!home || home.sellerId !== user.id || !supplier) redirect("/dashboard");
  if (!home.contract) redirect(`/dashboard/home/${home.id}/contract`);

  // The surveyor needs to reach the owner — a phone number is required here.
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) redirect(`/dashboard/home/${home.id}?error=phone`);
  user.phone = phone; // live store object

  // Fee band from the owner's value estimate (the listing's price field).
  const quote = homeReportQuote(supplier.id, home.price);
  if (!quote) redirect(`/dashboard/home/${home.id}?error=negotiation`);

  const invoice: Invoice = {
    id: newId("inv"),
    userId: user.id,
    homeId: home.id,
    kind: "home-report",
    description: `Home Report — ${supplier.name} (${home.addressLine || home.headline}) · fee £${quote.base} + our £${quote.margin} arrangement fee`,
    net: quote.base + quote.margin,
    vat: quote.vat,
    status: "due",
    createdAt: new Date().toISOString(),
  };
  upsertInvoice(invoice);
  home.homeReport = {
    status: "none",
    supplier: supplier.id,
    invoiceId: invoice.id,
  };
  upsertHome(home);
  refresh();
  redirect(`/pay/${invoice.id}`);
}

/**
 * Seller uploads their own photos — allowed at ANY stage (before the Home
 * Report too); only going LIVE is gated on the verified report. Prototype
 * storage: compressed to ~1200px JPEG data URLs in the in-memory store.
 * Production swaps this for Supabase Storage.
 */
export async function uploadHomePhotos(formData: FormData) {
  const user = await requireUser();
  const home = getHome(String(formData.get("homeId") ?? ""));
  if (!home || home.sellerId !== user.id) redirect("/dashboard");

  const MAX_PHOTOS = 8;
  const MAX_BYTES = 8 * 1024 * 1024;
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const sharp = (await import("sharp")).default;
  for (const file of files) {
    if (home.photos.length >= MAX_PHOTOS) break;
    if (file.size > MAX_BYTES || !file.type.startsWith("image/")) continue;
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const jpeg = await sharp(buf)
        .rotate() // respect EXIF orientation
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      home.photos.push(`data:image/jpeg;base64,${jpeg.toString("base64")}`);
    } catch {
      // Not a readable image — skip it quietly.
    }
  }
  upsertHome(home);
  refresh();
  redirect(`/dashboard/home/${home.id}#photos`);
}

export async function removeHomePhoto(formData: FormData) {
  const user = await requireUser();
  const home = getHome(String(formData.get("homeId") ?? ""));
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const index = Number(formData.get("index"));
  if (Number.isInteger(index) && index >= 0 && index < home.photos.length) {
    home.photos.splice(index, 1);
    upsertHome(home);
  }
  refresh();
  redirect(`/dashboard/home/${home.id}#photos`);
}

export async function uploadHomeReport(formData: FormData) {
  const user = await requireUser();
  const home = getHome(String(formData.get("homeId") ?? ""));
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const file = formData.get("report");
  const fileName =
    file instanceof File && file.name
      ? file.name
      : String(formData.get("fileName") ?? "").trim();
  if (!fileName || home.homeReport.status !== "ordered") {
    redirect(`/dashboard/home/${home.id}?error=report`);
  }
  // A Home Report is a PDF and they run large — reject anything else before
  // it reaches storage. (Storage itself is still to be built; see GO-LIVE.)
  const MAX_REPORT_BYTES = 25 * 1024 * 1024;
  if (file instanceof File) {
    const looksPdf =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!looksPdf) redirect(`/dashboard/home/${home.id}?error=report-type`);
    if (file.size > MAX_REPORT_BYTES) {
      redirect(`/dashboard/home/${home.id}?error=report-size`);
    }
  }
  home.homeReport = {
    ...home.homeReport,
    status: "uploaded",
    fileName,
    uploadedAt: new Date().toISOString(),
  };
  home.status = "pending-approval";
  upsertHome(home);
  pushNotification({
    userId: "u-phil",
    kind: "system",
    title: "Home Report awaiting verification",
    body: `${home.headline} — report uploaded, listing is gated until you verify it.`,
    href: "/admin/reports",
  });
  refresh();
  redirect(`/dashboard/home/${home.id}?uploaded=1`);
}

// ---- Payments (simulated checkout) ---------------------------------------

export async function payInvoice(formData: FormData) {
  const user = await requireUser();
  const invoice = getInvoice(String(formData.get("invoiceId") ?? ""));
  if (!invoice || invoice.userId !== user.id) redirect("/dashboard");
  if (invoice.status === "paid") redirect("/dashboard");
  invoice.status = "paid";
  invoice.paidAt = new Date().toISOString();
  upsertInvoice(invoice);

  if (invoice.kind === "home-report" && invoice.homeId) {
    const home = getHome(invoice.homeId);
    if (home) {
      const now = new Date().toISOString();
      const supplier = HOME_REPORT_SUPPLIERS.find(
        (s) => s.id === home.homeReport.supplier,
      );
      const quote = supplier ? homeReportQuote(supplier.id, home.price) : null;

      // Raise the purchase order: the owner has paid US; the surveyor does
      // the job and bills US against this number.
      if (supplier && quote) {
        const po: PurchaseOrder = {
          id: newId("PO"),
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
        upsertPurchaseOrder(po);
        home.homeReport = {
          ...home.homeReport,
          status: "ordered",
          orderedAt: now,
          poId: po.id,
        };
        upsertHome(home);

        const address = `${home.addressLine || home.headline}, ${areaLabel(home.areaId)}`;

        // 1) Instruct the surveyor.
        recordEmail({
          to: supplier.email,
          subject: `HOME REPORT INSTRUCTION — ${po.id} — ${address}`,
          body: [
            `Purchase order: ${po.id}`,
            "",
            `Please carry out a Home Report for the following property. This instruction is CONFIRMED and PAID on our side — invoice ${SITE_NAME} (quoting ${po.id}) for your fee of £${po.base} + VAT.`,
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
            `— ${SITE_NAME}`,
          ].join("\n"),
        });

        // 2) Tell the owner the surveyor has been instructed.
        pushNotification({
          userId: user.id,
          kind: "system",
          title: "Your Home Report is booked",
          body: `${supplier.name} have been instructed (ref ${po.id}) and will be in touch to arrange the visit.`,
          href: `/dashboard/home/${home.id}`,
        });
        recordEmail({
          to: user.email,
          subject: `Your Home Report is booked — ${supplier.name} will be in touch`,
          body: [
            `Hello ${user.name.split(" ")[0]},`,
            "",
            `Good news — your Home Report for ${address} is booked and paid.`,
            "",
            `We have instructed ${supplier.name} (our reference ${po.id}). They will contact you directly on ${user.phone ?? user.email} to arrange a convenient time to visit the property.`,
            "",
            "Once the completed report is uploaded and verified, your Hush Home goes fully live on the Matchlist — photos unblurred, report downloadable by registered Quiet Seekers, and possible-match alerts sent.",
            "",
            `— ${SITE_NAME}`,
          ].join("\n"),
        });

        // 3) Send the owner their receipt.
        recordEmail({
          to: user.email,
          subject: `Receipt — Home Report payment (${po.id})`,
          body: [
            `Hello ${user.name.split(" ")[0]},`,
            "",
            `Thank you for your payment. Your receipt:`,
            "",
            `  Home Report (${supplier.name})       £${po.base.toFixed(2)}`,
            `  VAT (20%)                            £${po.vat.toFixed(2)}`,
            `  ${SITE_NAME} arrangement fee          £${po.margin.toFixed(2)}`,
            `  --------------------------------------------`,
            `  Total paid                           £${po.total.toFixed(2)}`,
            "",
            `Property: ${address}`,
            `Reference: ${po.id}`,
            `Date: ${new Date().toLocaleDateString("en-GB")}`,
            "",
            `— ${SITE_NAME}`,
          ].join("\n"),
        });
      } else {
        // Fallback (shouldn't happen): keep the old behaviour.
        home.homeReport = { ...home.homeReport, status: "ordered", orderedAt: now };
        upsertHome(home);
      }
    }
    refresh();
    redirect(`/dashboard/home/${invoice.homeId}?ordered=1`);
  }
  if (invoice.kind === "conveyancing-deposit" && invoice.homeId) {
    refresh();
    redirect(`/homes/${invoice.homeId}/offer?deposit=paid`);
  }
  refresh();
  redirect("/dashboard");
}

// ---- Viewing slots + viewings --------------------------------------------

export async function addViewingSlot(formData: FormData) {
  const user = await requireUser();
  const home = getHome(String(formData.get("homeId") ?? ""));
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!date || !time) redirect(`/dashboard/home/${home.id}?error=slot`);
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  addSlot({
    id: newId("slot"),
    homeId: home.id,
    start: start.toISOString(),
    end: end.toISOString(),
    bookedBy: null,
  });
  refresh();
  redirect(`/dashboard/home/${home.id}#viewings`);
}

export async function deleteViewingSlot(formData: FormData) {
  const user = await requireUser();
  const slot = getSlot(String(formData.get("slotId") ?? ""));
  if (!slot) redirect("/dashboard");
  const home = getHome(slot.homeId);
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  removeSlot(slot.id);
  refresh();
  redirect(`/dashboard/home/${home.id}#viewings`);
}

export async function bookViewing(formData: FormData) {
  const user = await requireUser();
  const brief = getBrief(user.id);
  if (!brief?.contract) redirect("/dashboard/brief");
  const slot = getSlot(String(formData.get("slotId") ?? ""));
  if (!slot || slot.bookedBy) redirect("/matches?error=slot-taken");
  const home = getHome(slot.homeId);
  if (!home) redirect("/matches");
  slot.bookedBy = user.id;
  upsertViewing({
    id: newId("view"),
    homeId: home.id,
    seekerId: user.id,
    slotId: slot.id,
    start: slot.start,
    end: slot.end,
    status: "booked",
  });
  pushNotification({
    userId: home.sellerId,
    kind: "viewing",
    title: "Viewing booked",
    body: `A Quiet Seeker has booked a viewing of ${home.headline}.`,
    href: `/dashboard/home/${home.id}`,
  });
  refresh();
  redirect(`/homes/${home.id}?booked=1`);
}

export async function submitViewingFeedback(formData: FormData) {
  const user = await requireUser();
  const viewing = getViewing(String(formData.get("viewingId") ?? ""));
  if (!viewing || viewing.seekerId !== user.id) redirect("/dashboard");
  viewing.status = "completed";
  viewing.feedback = String(formData.get("feedback") ?? "").trim();
  viewing.stillInterested = formData.get("stillInterested") === "yes";
  upsertViewing(viewing);
  const home = getHome(viewing.homeId);
  if (home) {
    pushNotification({
      userId: home.sellerId,
      kind: "viewing",
      title: viewing.stillInterested
        ? "Post-viewing feedback: still interested"
        : "Post-viewing feedback received",
      body: viewing.feedback || "No written feedback left.",
      href: `/dashboard/home/${home.id}`,
    });
  }
  refresh();
  redirect(
    viewing.stillInterested
      ? `/homes/${viewing.homeId}/offer`
      : "/dashboard?feedback=thanks",
  );
}

// ---- Lawyer + offer flow --------------------------------------------------

export async function appointLawyer(formData: FormData) {
  const user = await requireUser();
  const home = getHome(String(formData.get("homeId") ?? ""));
  const lawyer = getLawyer(String(formData.get("lawyerId") ?? ""));
  if (!home || !lawyer) redirect("/matches");
  const invoice: Invoice = {
    id: newId("inv"),
    userId: user.id,
    homeId: home.id,
    lawyerId: lawyer.id,
    kind: "conveyancing-deposit",
    description: `Conveyancing deposit — ${lawyer.firm} appointed`,
    net: CONVEYANCING_DEPOSIT,
    vat: Math.round(CONVEYANCING_DEPOSIT * VAT_RATE * 100) / 100,
    status: "due",
    createdAt: new Date().toISOString(),
  };
  upsertInvoice(invoice);
  refresh();
  redirect(`/pay/${invoice.id}?lawyer=${lawyer.id}`);
}

export async function submitOffer(formData: FormData) {
  const user = await requireUser();
  const brief = getBrief(user.id);
  if (!brief?.contract) redirect("/dashboard/brief");
  const home = getHome(String(formData.get("homeId") ?? ""));
  const lawyer = getLawyer(String(formData.get("lawyerId") ?? ""));
  const amount = Number(formData.get("amount") ?? 0);
  if (!home || !lawyer || !amount) redirect("/matches");

  // The deposit must be paid before the offer can be submitted.
  const deposit = invoicesForUser(user.id).find(
    (i) =>
      i.kind === "conveyancing-deposit" &&
      i.homeId === home.id &&
      i.status === "paid",
  );
  if (!deposit) redirect(`/homes/${home.id}/offer?error=deposit`);

  const offer = {
    id: newId("offer"),
    homeId: home.id,
    seekerId: user.id,
    lawyerId: lawyer.id,
    amount,
    note: String(formData.get("note") ?? "").trim() || undefined,
    status: "submitted" as const,
    history: [
      {
        at: new Date().toISOString(),
        event: `Offer submitted: £${amount.toLocaleString("en-GB")}`,
      },
    ],
    createdAt: new Date().toISOString(),
  };
  upsertOffer(offer);
  pushNotification({
    userId: home.sellerId,
    kind: "offer",
    title: "You've received an offer",
    body: `£${amount.toLocaleString("en-GB")} for ${home.headline}. Accept, decline or counter from your dashboard.`,
    href: `/dashboard/home/${home.id}`,
  });
  refresh();
  redirect(`/homes/${home.id}?offer=submitted`);
}

export async function respondToOffer(formData: FormData) {
  const user = await requireUser();
  const offer = getOffer(String(formData.get("offerId") ?? ""));
  if (!offer) redirect("/dashboard");
  const home = getHome(offer.homeId);
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const action = String(formData.get("action") ?? "");
  const now = new Date().toISOString();

  if (action === "accept") {
    offer.status = "accepted";
    offer.history.push({ at: now, event: "Accepted by the seller" });
    home.status = "under-offer";
    upsertHome(home);
    const lawyer = getLawyer(offer.lawyerId);
    pushNotification({
      userId: offer.seekerId,
      kind: "offer",
      title: "Offer accepted 🎉",
      body: `Your offer on ${home.headline} was accepted. ${lawyer?.firm ?? "Your lawyer"} will conclude the sale.`,
      href: "/dashboard",
    });
  } else if (action === "decline") {
    offer.status = "declined";
    offer.history.push({ at: now, event: "Declined by the seller" });
    pushNotification({
      userId: offer.seekerId,
      kind: "offer",
      title: "Offer declined",
      body: `The seller has declined your offer on ${home.headline}.`,
      href: `/homes/${home.id}`,
    });
  } else if (action === "counter") {
    const counterAmount = Number(formData.get("counterAmount") ?? 0);
    if (!counterAmount) redirect(`/dashboard/home/${home.id}?error=counter`);
    offer.status = "countered";
    offer.counterAmount = counterAmount;
    offer.history.push({
      at: now,
      event: `Countered at £${counterAmount.toLocaleString("en-GB")}`,
    });
    pushNotification({
      userId: offer.seekerId,
      kind: "offer",
      title: "The seller has countered",
      body: `Counter-offer on ${home.headline}: £${counterAmount.toLocaleString("en-GB")}.`,
      href: `/homes/${home.id}/offer?counter=${offer.id}`,
    });
  }
  upsertOffer(offer);
  refresh();
  redirect(`/dashboard/home/${home.id}`);
}

export async function acceptCounter(formData: FormData) {
  const user = await requireUser();
  const offer = getOffer(String(formData.get("offerId") ?? ""));
  if (!offer || offer.seekerId !== user.id || offer.status !== "countered")
    redirect("/dashboard");
  const home = getHome(offer.homeId);
  if (!home) redirect("/dashboard");
  const now = new Date().toISOString();
  offer.amount = offer.counterAmount ?? offer.amount;
  offer.status = "accepted";
  offer.history.push({
    at: now,
    event: `Counter accepted at £${offer.amount.toLocaleString("en-GB")}`,
  });
  upsertOffer(offer);
  home.status = "under-offer";
  upsertHome(home);
  pushNotification({
    userId: home.sellerId,
    kind: "offer",
    title: "Counter-offer accepted",
    body: `The Quiet Seeker accepted your counter on ${home.headline}.`,
    href: `/dashboard/home/${home.id}`,
  });
  refresh();
  redirect("/dashboard?offer=agreed");
}

// ---- Introductions (seller clicked a Quiet Seeker) ------------------------

/**
 * Record that `sellerId` thinks their home fits `seekerId`'s brief. Idempotent
 * per pair. Nothing is revealed to either side: the admin gets the ping and
 * runs the gate (both registered + home details + verified report) before the
 * seeker is ever offered the introduction.
 */
function recordInterest(
  seekerId: string,
  sellerId: string,
  homeId: string | null,
): Introduction {
  const existing = findIntroduction(seekerId, sellerId);
  if (existing) return existing;
  const intro: Introduction = {
    id: newId("intro"),
    seekerId,
    sellerId,
    homeId: homeId ?? homesBySeller(sellerId)[0]?.id ?? null,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  upsertIntroduction(intro);
  pushNotification({
    userId: "u-phil",
    kind: "system",
    title: "New introduction request",
    body: "A home owner clicked a Quiet Seeker's profile. Check the gate before offering the introduction.",
    href: "/admin/introductions",
  });
  return intro;
}

/** Signed-in "they might want my home" button on /seekers/[ref]. */
export async function expressInterestInSeeker(formData: FormData) {
  const user = await requireUser();
  const ref = String(formData.get("seekerRef") ?? "").trim();
  const brief = getBriefByPublicRef(ref);
  if (brief?.contract) {
    if (brief.userId === user.id) redirect("/seekers");
    recordInterest(brief.userId, user.id, null);
  } else {
    // Live Mowatt sheet seeker: validate the ref against the sheets, then
    // record the interest under a mowatt: id — the Mowatt team makes the
    // approach offline, since sheet seekers have no site account yet.
    const { findMowattSeeker } = await import("./mowatt-bridge");
    const mowatt = await findMowattSeeker(ref);
    if (!mowatt || !mowatt.active) redirect("/seekers");
    recordInterest(`mowatt:${ref}`, user.id, null);
  }
  refresh();
  redirect(`/seekers/${encodeURIComponent(ref)}?interested=1`);
}

/**
 * Admin offers the introduction to the seeker — only allowed once the gate
 * is met: the seller has a home profile with a signed contract. (The Home
 * Report status is shown alongside so the admin can hold out for verified.)
 */
export async function adminOfferIntroduction(formData: FormData) {
  await requireAdmin();
  const intro = getIntroduction(String(formData.get("introId") ?? ""));
  if (!intro || intro.status !== "new") redirect("/admin/introductions");
  const homeId = String(formData.get("homeId") ?? "") || intro.homeId;
  const home = homeId ? getHome(homeId) : undefined;
  if (!home || home.sellerId !== intro.sellerId || !home.contract) {
    redirect("/admin/introductions?error=gate");
  }
  intro.homeId = home.id;
  intro.status = "offered";
  intro.offeredAt = new Date().toISOString();
  upsertIntroduction(intro);
  pushNotification({
    userId: intro.seekerId,
    kind: "match",
    title: "A home owner spotted your profile",
    body: "Someone thinks their home fits your brief. Want to see it? It's entirely your choice — say yes and we'll show you the Hush Home.",
    href: "/dashboard",
  });
  refresh();
  redirect("/admin/introductions");
}

/** The seeker's answer to an offered introduction: see it, or pass. */
export async function respondToIntroduction(formData: FormData) {
  const user = await requireUser();
  const intro = getIntroduction(String(formData.get("introId") ?? ""));
  if (!intro || intro.seekerId !== user.id || intro.status !== "offered")
    redirect("/dashboard");
  const accepted = String(formData.get("answer")) === "yes";
  intro.status = accepted ? "accepted" : "declined";
  intro.respondedAt = new Date().toISOString();
  upsertIntroduction(intro);
  const home = intro.homeId ? getHome(intro.homeId) : undefined;
  if (home) {
    pushNotification({
      userId: home.sellerId,
      kind: "match",
      title: accepted
        ? "Introduction accepted 🎉"
        : "Introduction declined",
      body: accepted
        ? `The Quiet Seeker said yes — they can now view ${home.headline}.`
        : "The Quiet Seeker passed this time. Your identity was never shared, and your home stays on the Matchlist.",
      href: `/dashboard/home/${home.id}`,
    });
  }
  refresh();
  redirect(
    accepted && intro.homeId ? `/homes/${intro.homeId}` : "/dashboard",
  );
}

// ---- Matchlist + notifications -------------------------------------------

export async function toggleSaveHome(formData: FormData) {
  const user = await requireUser();
  toggleSaved(user.id, String(formData.get("homeId") ?? ""));
  refresh();
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  markNotificationsRead(user.id);
  refresh();
}

/** Dashboard setting: the % a NEW pairing must hit before we shout. */
export async function saveAlertPref(formData: FormData) {
  const user = await requireUser();
  const pct = Number(formData.get("matchAlertPct"));
  const allowed = new Set([0, 50, 70, 80, 90, 95]);
  if (allowed.has(pct)) {
    user.matchAlertPct = pct; // store user object is live in-memory
  }
  refresh();
  redirect("/dashboard?saved=alerts");
}

// ---- Admin ----------------------------------------------------------------

export async function adminVerifyReport(formData: FormData) {
  await requireAdmin();
  const home = getHome(String(formData.get("homeId") ?? ""));
  if (!home || home.homeReport.status !== "uploaded") redirect("/admin/reports");
  home.homeReport = {
    ...home.homeReport,
    status: "verified",
    verifiedAt: new Date().toISOString(),
  };
  home.status = "live";
  upsertHome(home);
  pushNotification({
    userId: home.sellerId,
    kind: "system",
    title: "Your Hush Home is live",
    body: `${home.headline} — Home Report verified. The Matchlist is already looking.`,
    href: "/dashboard",
  });
  // The home just went live: tell every Quiet Seeker it matches.
  alertSeekersAboutHome(home);
  refresh();
  redirect("/admin/reports");
}

export async function adminConcludeMissives(formData: FormData) {
  await requireAdmin();
  const offer = getOffer(String(formData.get("offerId") ?? ""));
  if (!offer || offer.status !== "accepted") redirect("/admin/deals");
  const home = getHome(offer.homeId);
  if (!home) redirect("/admin/deals");
  const now = new Date().toISOString();
  offer.missivesConcludedAt = now;
  offer.history.push({ at: now, event: "Missives concluded" });
  upsertOffer(offer);
  home.status = "sold";
  upsertHome(home);
  const fee = sourcingFee(offer.amount);
  upsertInvoice({
    id: newId("inv"),
    userId: offer.seekerId,
    homeId: home.id,
    offerId: offer.id,
    kind: "sourcing-fee",
    description: `Buyer sourcing fee — 0.8% of £${offer.amount.toLocaleString("en-GB")} (${home.headline})`,
    net: fee,
    vat: Math.round(fee * VAT_RATE * 100) / 100,
    status: "due",
    createdAt: now,
  });
  pushNotification({
    userId: offer.seekerId,
    kind: "system",
    title: "Missives concluded — congratulations",
    body: `${home.headline} is yours. Your sourcing fee invoice (0.8% + VAT) is in your dashboard.`,
    href: "/dashboard",
  });
  refresh();
  redirect("/admin/deals");
}

export async function adminRecordWithdrawal(formData: FormData) {
  await requireAdmin();
  const home = getHome(String(formData.get("homeId") ?? ""));
  if (!home) redirect("/admin/deals");
  const now = new Date().toISOString();
  home.status = "withdrawn";
  upsertHome(home);
  upsertInvoice({
    id: newId("inv"),
    userId: home.sellerId,
    homeId: home.id,
    kind: "withdrawal-fee",
    description: `Withdrawal fee — ${home.headline} listed on the open market`,
    net: 300,
    vat: 60,
    status: "due",
    createdAt: now,
  });
  pushNotification({
    userId: home.sellerId,
    kind: "system",
    title: "Listing withdrawn",
    body: `${home.headline} has been withdrawn. The £300 (+ VAT) withdrawal fee applies, per your seller agreement.`,
    href: "/dashboard",
  });
  refresh();
  redirect("/admin/deals");
}

/** Purchase-order lifecycle: surveyor's invoice arrives, then we pay it. */
export async function adminUpdatePurchaseOrder(formData: FormData) {
  await requireAdmin();
  const po = getPurchaseOrder(String(formData.get("poId") ?? ""));
  const action = String(formData.get("action") ?? "");
  if (po) {
    const now = new Date().toISOString();
    if (action === "billed" && po.status === "instructed") {
      po.status = "billed";
      po.billedAt = now;
    } else if (action === "settled" && po.status === "billed") {
      po.status = "settled";
      po.settledAt = now;
    }
    upsertPurchaseOrder(po);
  }
  refresh();
  redirect("/admin/orders");
}

export async function adminMarkInvoicePaid(formData: FormData) {
  await requireAdmin();
  const invoice = getInvoice(String(formData.get("invoiceId") ?? ""));
  if (invoice && invoice.status === "due") {
    invoice.status = "paid";
    invoice.paidAt = new Date().toISOString();
    upsertInvoice(invoice);
  }
  refresh();
  redirect("/admin/invoices");
}

export async function adminSaveWeights(formData: FormData) {
  await requireAdmin();
  const current = matchWeights();
  const next = { ...current };
  for (const key of Object.keys(next) as (keyof typeof next)[]) {
    const v = Number(formData.get(key));
    if (Number.isFinite(v) && v >= 0) next[key] = v;
  }
  setMatchWeights(next);
  refresh();
  redirect("/admin/settings?saved=1");
}

export async function adminSaveLawyer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("lawyerId") ?? "") || newId("law");
  upsertLawyer({
    id,
    firm: String(formData.get("firm") ?? "").trim(),
    contactName: String(formData.get("contactName") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    feeEstimate: Number(formData.get("feeEstimate") ?? 0),
    blurb: String(formData.get("blurb") ?? "").trim(),
  });
  refresh();
  redirect("/admin/lawyers");
}

export async function adminRemoveLawyer(formData: FormData) {
  await requireAdmin();
  dbRemoveLawyer(String(formData.get("lawyerId") ?? ""));
  refresh();
  redirect("/admin/lawyers");
}
