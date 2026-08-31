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
  adminUserId,
  audit,
  chargesForSubject,
  createMatchReportLead,
  createProfile,
  findIntroduction,
  getBrief,
  getBriefByPublicRef,
  getHomeUnscoped,
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
  introductionsBySeller,
  PUBLIC_HOME_STATUSES,
  invoicesForUser,
  matchWeights,
  newId,
  nextPurchaseOrderRef,
  nextSeekerRef,
  pushNotification,
  removeLawyer as dbRemoveLawyer,
  removeSlot,
  setMatchWeights,
  toggleSaved,
  updateCharge,
  upsertBrief,
  upsertHome,
  upsertIntroduction,
  upsertInvoice,
  upsertLawyer,
  upsertOffer,
  upsertUser,
  upsertViewing,
  markNotificationsRead,
} from "./db";
import { alertSeekersAboutHome, alertSellersAboutBrief } from "./alerts";
import { areaLabel, getArea } from "./areas";
import { uploadHomeReportFile } from "./storage";
import { fulfilHomeReportOrder } from "./fulfilment";
import {
  assertKeyMatchesEnvironment,
  stripe,
  stripeConfigured,
  toPence,
} from "./stripe";
import {
  clearSession,
  currentUser,
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from "./session";
import {
  CONFIG,
  CONTRACT_VERSIONS,
  HOME_REPORT_SUPPLIERS,
  SITE_NAME,
  VAT_RATE,
  exVat,
  homeReportQuote,
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

export async function register(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const intent = String(formData.get("intent") ?? "seeker");
  const seekerRef = String(formData.get("seeker") ?? "").trim();

  const back = (error: string) =>
    redirect(
      `/join?${new URLSearchParams({
        ...(intent === "seller" ? { as: "seller" } : {}),
        ...(seekerRef ? { seeker: seekerRef } : {}),
        error,
      })}`,
    );

  if (!name || !email.includes("@")) back("invalid");
  if (password.length < 10) back("weak-password");

  // The login account comes first — the profile row is tied to it.
  const created = await signUpWithPassword(email, password);
  if (!created.ok) {
    // Deliberately vague: never reveal whether an address is registered.
    back("signup-failed");
    return;
  }
  const user = await createProfile({ id: created.userId, name, email });

  // With email confirmation switched on, sign-up returns no session, so every
  // signed-in destination below would bounce straight back to /login with no
  // explanation. Send them to confirm instead.
  const onward = (path: string) =>
    created.needsConfirmation ? "/login?registered=1" : path;

  // Arrived via a Quiet Seeker's public profile: record the interest now,
  // so the introduction pipeline starts the moment the account exists.
  const target = seekerRef ? await getBriefByPublicRef(seekerRef) : undefined;
  if (target?.contract && target.userId !== user.id) {
    await recordInterest(target.userId, user.id, null);
    refresh();
    redirect(onward(`/dashboard/home/new?seeker=${encodeURIComponent(seekerRef)}`));
  }
  if (seekerRef && !target) {
    const { findMowattSeeker } = await import("./mowatt-bridge");
    const mowatt = await findMowattSeeker(seekerRef);
    if (mowatt?.active) {
      await recordInterest(`mowatt:${seekerRef}`, user.id, null);
      refresh();
      redirect(onward(`/dashboard/home/new?seeker=${encodeURIComponent(seekerRef)}`));
    }
  }

  refresh();
  redirect(onward(intent === "seller" ? "/dashboard/home/new" : "/dashboard/brief"));
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const result = await signInWithPassword(email, password);
  if (!result.ok) redirect("/login?error=bad-credentials");
  const user = await getUserByEmail(email);
  refresh();
  redirect(user?.isAdmin ? "/admin" : "/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (email.includes("@")) await sendPasswordReset(email);
  // Same response either way, so the form can't be used to discover
  // which email addresses have accounts.
  redirect("/login?reset=sent");
}

export async function signOut() {
  await clearSession();
  refresh();
  redirect("/");
}

// ---- Quiet Seeker brief ---------------------------------------------------

export async function saveBrief(formData: FormData) {
  const user = await requireUser();
  const existing = await getBrief(user.id);
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
    publicRef: existing?.publicRef ?? await nextSeekerRef(),
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
  await upsertBrief(brief);
  refresh();
  if (!brief.contract) redirect("/dashboard/brief/contract");
  redirect("/dashboard?saved=brief");
}

export async function signSeekerContract(formData: FormData) {
  const user = await requireUser();
  const typedName = String(formData.get("typedName") ?? "").trim();
  const agreed = formData.get("agree") === "on";
  const brief = await getBrief(user.id);
  if (!brief) redirect("/dashboard/brief");
  if (!typedName || !agreed)
    redirect("/dashboard/brief/contract?error=incomplete");
  brief.contract = await makeSignature(typedName, CONTRACT_VERSIONS.seeker);
  brief.updatedAt = new Date().toISOString();
  await upsertBrief(brief);
  // The brief just went live on the Matchlist: tell matching sellers.
  await alertSellersAboutBrief(brief);
  refresh();
  redirect("/dashboard?signed=seeker");
}

// ---- Hush Home listing ----------------------------------------------------

export async function saveHomeListing(formData: FormData) {
  const user = await requireUser();
  const homeId = String(formData.get("homeId") ?? "");
  const existing = homeId ? await getHomeUnscoped(homeId) : undefined;
  if (existing && existing.sellerId !== user.id) redirect("/dashboard");

  const features = formData.getAll("features").map(String) as FeatureTag[];
  const home: HushHome = {
    id: existing?.id ?? newId(),
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
    // Preview listings are gone (BUILD-BRIEF.md §3) — the column stays but
    // is never set or displayed any more.
    previewListed: false,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  if (!home.headline || !home.areaId || !home.price) {
    redirect(existing ? `/dashboard/home/${home.id}?error=invalid` : "/dashboard/home/new?error=invalid");
  }
  await upsertHome(home);
  refresh();
  redirect(`/dashboard/home/${home.id}`);
}

export async function signSellerContract(formData: FormData) {
  const user = await requireUser();
  const home = await getHomeUnscoped(String(formData.get("homeId") ?? ""));
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const typedName = String(formData.get("typedName") ?? "").trim();
  const agreed = formData.get("agree") === "on";
  if (!typedName || !agreed)
    redirect(`/dashboard/home/${home.id}/contract?error=incomplete`);
  home.contract = await makeSignature(typedName, CONTRACT_VERSIONS.seller);
  await upsertHome(home);
  refresh();
  redirect(`/dashboard/home/${home.id}`);
}

export async function orderHomeReport(formData: FormData) {
  const user = await requireUser();
  const home = await getHomeUnscoped(String(formData.get("homeId") ?? ""));
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
    id: newId(),
    userId: user.id,
    homeId: home.id,
    kind: "home-report",
    description: `Home Report · ${supplier.name} (${home.addressLine || home.headline}) · fee £${quote.base} + our £${quote.margin} arrangement fee`,
    net: quote.base + quote.margin,
    vat: quote.vat,
    status: "due",
    createdAt: new Date().toISOString(),
  };
  // The order exists in our database BEFORE any money moves, so a payment
  // can never arrive with nothing attached to it.
  await upsertInvoice(invoice);
  home.homeReport = {
    status: "none",
    supplier: supplier.id,
    invoiceId: invoice.id,
  };
  await upsertHome(home);
  await upsertUser(user); // keep the phone number the surveyor will ring

  if (!stripeConfigured()) {
    // No card processing configured — fall back to the demo checkout so
    // local work isn't blocked. Never reachable in production.
    refresh();
    redirect(`/pay/${invoice.id}`);
  }

  assertKeyMatchesEnvironment();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const total = invoice.net + invoice.vat;

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    client_reference_id: invoice.id,
    // Everything fulfilment needs, carried by Stripe and handed back to
    // the webhook — we never trust values from the browser.
    metadata: { invoiceId: invoice.id, homeId: home.id, sellerId: user.id },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: toPence(total),
          product_data: {
            name: `Home Report · ${supplier.name}`,
            description: `${home.addressLine || home.headline}. Includes the surveyor's fee, VAT and our £${quote.margin} arrangement fee.`,
          },
        },
      },
    ],
    success_url: `${site}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/dashboard/home/${home.id}?payment=cancelled`,
  });

  invoice.stripeCheckoutId = session.id;
  await upsertInvoice(invoice);

  if (!session.url) redirect(`/dashboard/home/${home.id}?error=checkout`);
  redirect(session.url);
}

/**
 * Seller uploads their own photos — allowed at ANY stage (before the Home
 * Report too); only going LIVE is gated on the verified report. Prototype
 * storage: compressed to ~1200px JPEG data URLs in the in-memory store.
 * Production swaps this for Supabase Storage.
 */
export async function uploadHomePhotos(formData: FormData) {
  const user = await requireUser();
  const home = await getHomeUnscoped(String(formData.get("homeId") ?? ""));
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
  await upsertHome(home);
  refresh();
  redirect(`/dashboard/home/${home.id}#photos`);
}

export async function removeHomePhoto(formData: FormData) {
  const user = await requireUser();
  const home = await getHomeUnscoped(String(formData.get("homeId") ?? ""));
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const index = Number(formData.get("index"));
  if (Number.isInteger(index) && index >= 0 && index < home.photos.length) {
    home.photos.splice(index, 1);
    await upsertHome(home);
  }
  refresh();
  redirect(`/dashboard/home/${home.id}#photos`);
}

export async function uploadHomeReport(formData: FormData) {
  const user = await requireUser();
  const home = await getHomeUnscoped(String(formData.get("homeId") ?? ""));
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const file = formData.get("report");
  const fileName =
    file instanceof File && file.name
      ? file.name
      : String(formData.get("fileName") ?? "").trim();
  if (!fileName || home.homeReport.status !== "ordered") {
    redirect(`/dashboard/home/${home.id}?error=report`);
  }
  // A Home Report is a PDF and they run large — reject anything else
  // before it reaches storage.
  const MAX_REPORT_BYTES = 25 * 1024 * 1024;
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/home/${home.id}?error=report`);
  }
  const looksPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!looksPdf) redirect(`/dashboard/home/${home.id}?error=report-type`);
  if (file.size > MAX_REPORT_BYTES) {
    redirect(`/dashboard/home/${home.id}?error=report-size`);
  }

  // Store the actual document in the private bucket. If this fails the
  // listing must NOT advance — a report that isn't stored isn't a report.
  const stored = await uploadHomeReportFile(home.id, file);
  if (!stored.ok) {
    console.error("home report upload failed:", stored.message);
    redirect(`/dashboard/home/${home.id}?error=report-upload`);
  }

  home.homeReport = {
    ...home.homeReport,
    status: "uploaded",
    fileName,
    storagePath: stored.path,
    uploadedAt: new Date().toISOString(),
  };
  home.status = "pending-approval";
  await upsertHome(home);
  const adminId = await adminUserId();
  if (adminId) await pushNotification({
    userId: adminId,
    kind: "system",
    title: "Home Report awaiting verification",
    body: `${home.headline}: report uploaded, listing is gated until you verify it.`,
    href: "/admin/reports",
  });
  refresh();
  redirect(`/dashboard/home/${home.id}?uploaded=1`);
}

// ---- Payments (simulated checkout) ---------------------------------------

export async function payInvoice(formData: FormData) {
  const user = await requireUser();
  const invoice = await getInvoice(String(formData.get("invoiceId") ?? ""));
  if (!invoice || invoice.userId !== user.id) redirect("/dashboard");
  if (invoice.status === "paid") redirect("/dashboard");

  // Local demo checkout only — real cards go through Stripe, and real
  // fulfilment happens on the signed webhook. This exists so the flow can
  // be exercised without card processing configured.
  if (stripeConfigured()) redirect("/dashboard");

  if (invoice.kind === "home-report" && invoice.homeId) {
    // Exactly the same path the webhook uses — one implementation only.
    await fulfilHomeReportOrder(invoice.id);
    refresh();
    redirect(`/dashboard/home/${invoice.homeId}?ordered=1`);
  }

  invoice.status = "paid";
  invoice.paidAt = new Date().toISOString();
  await upsertInvoice(invoice);

  if (invoice.kind === "conveyancing-deposit" && invoice.homeId) {
    refresh();
    redirect(`/homes/${invoice.homeId}/offer?deposit=paid`);
  }
  refresh();
  redirect("/dashboard");
}
export async function addViewingSlot(formData: FormData) {
  const user = await requireUser();
  const home = await getHomeUnscoped(String(formData.get("homeId") ?? ""));
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!date || !time) redirect(`/dashboard/home/${home.id}?error=slot`);
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  await addSlot({
    id: newId(),
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
  const slot = await getSlot(String(formData.get("slotId") ?? ""));
  if (!slot) redirect("/dashboard");
  const home = await getHomeUnscoped(slot.homeId);
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  await removeSlot(slot.id);
  refresh();
  redirect(`/dashboard/home/${home.id}#viewings`);
}

export async function bookViewing(formData: FormData) {
  const user = await requireUser();
  const brief = await getBrief(user.id);
  if (!brief?.contract) redirect("/dashboard/brief");
  const slot = await getSlot(String(formData.get("slotId") ?? ""));
  if (!slot || slot.bookedBy) redirect("/matches?error=slot-taken");
  const home = await getHomeUnscoped(slot.homeId);
  if (!home) redirect("/matches");
  slot.bookedBy = user.id;
  await upsertViewing({
    id: newId(),
    homeId: home.id,
    seekerId: user.id,
    slotId: slot.id,
    start: slot.start,
    end: slot.end,
    status: "booked",
  });
  await pushNotification({
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
  const viewing = await getViewing(String(formData.get("viewingId") ?? ""));
  if (!viewing || viewing.seekerId !== user.id) redirect("/dashboard");
  viewing.status = "completed";
  viewing.feedback = String(formData.get("feedback") ?? "").trim();
  viewing.stillInterested = formData.get("stillInterested") === "yes";
  await upsertViewing(viewing);
  const home = await getHomeUnscoped(viewing.homeId);
  if (home) {
    await pushNotification({
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

// appointLawyer is gone (DECISIONS.md §0.5): requiring a lawyer — or any
// payment — before an offer is conditional selling under the 1991 Order.
// A buyer appoints a solicitor of their choice after acceptance.

export async function submitOffer(formData: FormData) {
  const user = await requireUser();
  const brief = await getBrief(user.id);
  if (!brief?.contract) redirect("/dashboard/brief");
  const home = await getHomeUnscoped(String(formData.get("homeId") ?? ""));
  const amount = Number(formData.get("amount") ?? 0);
  if (!home || !amount) redirect("/matches");

  const offer = {
    id: newId(),
    homeId: home.id,
    seekerId: user.id,
    lawyerId: null,
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
  await upsertOffer(offer);
  await pushNotification({
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
  const offer = await getOffer(String(formData.get("offerId") ?? ""));
  if (!offer) redirect("/dashboard");
  const home = await getHomeUnscoped(offer.homeId);
  if (!home || home.sellerId !== user.id) redirect("/dashboard");
  const action = String(formData.get("action") ?? "");
  const now = new Date().toISOString();

  if (action === "accept") {
    offer.status = "accepted";
    offer.history.push({ at: now, event: "Accepted by the seller" });
    home.status = "under-offer";
    await upsertHome(home);
    const lawyer = offer.lawyerId ? await getLawyer(offer.lawyerId) : undefined;
    await pushNotification({
      userId: offer.seekerId,
      kind: "offer",
      title: "Offer accepted 🎉",
      body: lawyer
        ? `Your offer on ${home.headline} was accepted. ${lawyer.firm} will conclude the sale.`
        : `Your offer on ${home.headline} was accepted. Next step: appoint a solicitor — yours or one of ours — to conclude the missives.`,
      href: "/dashboard",
    });
  } else if (action === "decline") {
    offer.status = "declined";
    offer.history.push({ at: now, event: "Declined by the seller" });
    await pushNotification({
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
    await pushNotification({
      userId: offer.seekerId,
      kind: "offer",
      title: "The seller has countered",
      body: `Counter-offer on ${home.headline}: £${counterAmount.toLocaleString("en-GB")}.`,
      href: `/homes/${home.id}/offer?counter=${offer.id}`,
    });
  }
  await upsertOffer(offer);
  refresh();
  redirect(`/dashboard/home/${home.id}`);
}

export async function acceptCounter(formData: FormData) {
  const user = await requireUser();
  const offer = await getOffer(String(formData.get("offerId") ?? ""));
  if (!offer || offer.seekerId !== user.id || offer.status !== "countered")
    redirect("/dashboard");
  const home = await getHomeUnscoped(offer.homeId);
  if (!home) redirect("/dashboard");
  const now = new Date().toISOString();
  offer.amount = offer.counterAmount ?? offer.amount;
  offer.status = "accepted";
  offer.history.push({
    at: now,
    event: `Counter accepted at £${offer.amount.toLocaleString("en-GB")}`,
  });
  await upsertOffer(offer);
  home.status = "under-offer";
  await upsertHome(home);
  await pushNotification({
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
async function recordInterest(
  seekerId: string,
  sellerId: string,
  homeId: string | null,
): Promise<Introduction> {
  const existing = await findIntroduction(seekerId, sellerId);
  if (existing) return existing;
  const intro: Introduction = {
    id: newId(),
    seekerId,
    sellerId,
    homeId: homeId ?? (await homesBySeller(sellerId))[0]?.id ?? null,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  await upsertIntroduction(intro);
  const adminId = await adminUserId();
  if (adminId) await pushNotification({
    userId: adminId,
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
  const brief = await getBriefByPublicRef(ref);
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
 * is met: signed contract AND the home is live. s.101(3) Housing (Scotland)
 * Act 2006 catches communication of availability to ANY person, so a
 * pre-live introduction is marketing without a Home Report, full stop.
 * Pre-live hands stay queued and fire automatically at go-live
 * (offerQueuedIntroductions).
 */
export async function adminOfferIntroduction(formData: FormData) {
  await requireAdmin();
  const intro = await getIntroduction(String(formData.get("introId") ?? ""));
  if (!intro || intro.status !== "new") redirect("/admin/introductions");
  const homeId = String(formData.get("homeId") ?? "") || intro.homeId;
  const home = homeId ? await getHomeUnscoped(homeId) : undefined;
  if (!home || home.sellerId !== intro.sellerId || !home.contract) {
    redirect("/admin/introductions?error=gate");
  }
  if (!(PUBLIC_HOME_STATUSES as readonly string[]).includes(home.status)) {
    redirect("/admin/introductions?error=prelive");
  }
  intro.homeId = home.id;
  intro.status = "offered";
  intro.offeredAt = new Date().toISOString();
  await upsertIntroduction(intro);
  await pushNotification({
    userId: intro.seekerId,
    kind: "match",
    title: "A home owner spotted your profile",
    body: "Someone thinks their home fits your brief. Want to see it? It's entirely your choice. Say yes and we'll show you the Hush Home.",
    href: "/dashboard",
  });
  refresh();
  redirect("/admin/introductions");
}

/**
 * A hand raised on a pre-live home is queued silently: the seeker learns
 * nothing — no home, no attributes, no notification — until the Home Report
 * is verified and the home goes live. This fires those queued introductions
 * the moment that happens. Sheet-sourced (mowatt:) seekers have no account,
 * so those queue to the admin for the offline approach instead.
 */
async function offerQueuedIntroductions(home: HushHome): Promise<void> {
  const queued = (await introductionsBySeller(home.sellerId)).filter(
    (i) => i.status === "new" && (i.homeId === home.id || !i.homeId),
  );
  const now = new Date().toISOString();
  for (const intro of queued) {
    if (intro.seekerId.startsWith("mowatt:")) {
      const adminId = await adminUserId();
      if (adminId)
        await pushNotification({
          userId: adminId,
          kind: "system",
          title: "Queued introduction ready",
          body: `${home.headline} is now live. ${intro.seekerId.slice(7)} had a hand raised pre-live — make the approach now.`,
          href: "/admin/introductions",
        });
      continue;
    }
    intro.homeId = home.id;
    intro.status = "offered";
    intro.offeredAt = now;
    await upsertIntroduction(intro);
    await pushNotification({
      userId: intro.seekerId,
      kind: "match",
      title: "A home owner spotted your profile",
      body: "Someone thinks their home fits your brief. Want to see it? It's entirely your choice. Say yes and we'll show you the Hush Home.",
      href: "/dashboard",
    });
  }
}

/** The seeker's answer to an offered introduction: see it, or pass. */
export async function respondToIntroduction(formData: FormData) {
  const user = await requireUser();
  const intro = await getIntroduction(String(formData.get("introId") ?? ""));
  if (!intro || intro.seekerId !== user.id || intro.status !== "offered")
    redirect("/dashboard");
  const accepted = String(formData.get("answer")) === "yes";
  intro.status = accepted ? "accepted" : "declined";
  intro.respondedAt = new Date().toISOString();
  await upsertIntroduction(intro);
  const home = intro.homeId ? await getHomeUnscoped(intro.homeId) : undefined;
  if (home) {
    await pushNotification({
      userId: home.sellerId,
      kind: "match",
      title: accepted
        ? "Introduction accepted 🎉"
        : "Introduction declined",
      body: accepted
        ? `The Quiet Seeker said yes. They can now view ${home.headline}.`
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
  await toggleSaved(user.id, String(formData.get("homeId") ?? ""));
  refresh();
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await markNotificationsRead(user.id);
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
  const home = await getHomeUnscoped(String(formData.get("homeId") ?? ""));
  if (!home || home.homeReport.status !== "uploaded") redirect("/admin/reports");
  home.homeReport = {
    ...home.homeReport,
    status: "verified",
    verifiedAt: new Date().toISOString(),
  };
  home.status = "live";
  await upsertHome(home);
  await audit(null, "listing.status_changed", "listing", home.id, {
    to: "live",
    via: "adminVerifyReport",
  });
  await pushNotification({
    userId: home.sellerId,
    kind: "system",
    title: "Your Hush Home is live",
    body: `${home.headline}: Home Report verified. The Matchlist is already looking.`,
    href: "/dashboard",
  });
  // The home just went live: tell every Quiet Seeker it matches, and fire
  // any hands raised while it was still pre-live.
  await alertSeekersAboutHome(home);
  await offerQueuedIntroductions(home);
  refresh();
  redirect("/admin/reports");
}

export async function adminConcludeMissives(formData: FormData) {
  await requireAdmin();
  const offer = await getOffer(String(formData.get("offerId") ?? ""));
  if (!offer || offer.status !== "accepted") redirect("/admin/deals");
  const home = await getHomeUnscoped(offer.homeId);
  if (!home) redirect("/admin/deals");
  const now = new Date().toISOString();
  offer.missivesConcludedAt = now;
  offer.history.push({ at: now, event: "Missives concluded" });
  await upsertOffer(offer);
  home.status = "sold";
  await upsertHome(home);
  // Fixed, every transaction, regardless of price. Consumer-facing figures
  // are VAT-inclusive; the ledger row stays net + vat.
  const gross = CONFIG.fees.buyerFeeGross;
  const net = exVat(gross);
  await upsertInvoice({
    id: newId(),
    userId: offer.seekerId,
    homeId: home.id,
    offerId: offer.id,
    kind: "sourcing-fee",
    description: `Buyer fee · fixed £${gross} including VAT (${home.headline})`,
    net,
    vat: Math.round((gross - net) * 100) / 100,
    status: "due",
    createdAt: now,
  });
  await pushNotification({
    userId: offer.seekerId,
    kind: "system",
    title: "Missives concluded. Congratulations",
    body: `${home.headline} is yours. Your buyer fee invoice (£${gross} including VAT) is in your dashboard.`,
    href: "/dashboard",
  });
  refresh();
  redirect("/admin/deals");
}

/**
 * DECISIONS.md §3: on withdrawal (or listing elsewhere, or the longstop)
 * the seller owes the £580 Home Report charge and NOTHING else — the £300
 * withdrawal fee is abolished. If the listing carries a deferred (pending)
 * Home Report charge it becomes due, collected from the stored card only
 * after CONFIG.cardNoticeDays' written notice. A seller who already paid
 * for their Home Report upfront owes nothing at all.
 */
export async function adminRecordWithdrawal(formData: FormData) {
  const admin = await requireAdmin();
  const home = await getHomeUnscoped(String(formData.get("homeId") ?? ""));
  if (!home) redirect("/admin/deals");
  home.status = "withdrawn";
  await upsertHome(home);
  await audit(admin.id, "listing.withdrawn", "listing", home.id, {
    headline: home.headline,
  });

  const pendingHomeReport = (await chargesForSubject("listing", home.id)).find(
    (c) => c.type === "home_report" && c.status === "pending",
  );
  const seller = await getUser(home.sellerId);

  if (pendingHomeReport) {
    const dueAt = new Date(
      Date.now() + CONFIG.cardNoticeDays * 86_400_000,
    ).toISOString();
    await updateCharge(
      pendingHomeReport.id,
      {
        status: "due",
        trigger: "withdrawn",
        collectionRoute: "card",
        dueAt,
        notes: `Withdrawal recorded; ${CONFIG.cardNoticeDays} days' written notice sent before any card collection.`,
      },
      admin.id,
    );
    if (seller) {
      await recordEmail({
        to: seller.email,
        subject: `Your listing has been withdrawn — written notice of your Home Report charge`,
        body: [
          `Hello ${seller.name.split(" ")[0]},`,
          "",
          `${home.headline} has been withdrawn from Matchlisted.`,
          "",
          `As set out in your seller agreement, your deferred Home Report charge of £${CONFIG.fees.homeReportGross} (including VAT) now becomes payable. There is no withdrawal fee and nothing else to pay.`,
          "",
          `This email is your ${CONFIG.cardNoticeDays} days' written notice: we will collect £${CONFIG.fees.homeReportGross} from your stored card on or after ${new Date(dueAt).toLocaleDateString("en-GB")}. If anything here looks wrong, reply to this email before that date.`,
          "",
          `${SITE_NAME}`,
        ].join("\n"),
      });
    }
  }

  await pushNotification({
    userId: home.sellerId,
    kind: "system",
    title: "Listing withdrawn",
    body: pendingHomeReport
      ? `${home.headline} has been withdrawn. Your £${CONFIG.fees.homeReportGross} Home Report charge becomes payable, and nothing else. We've emailed your ${CONFIG.cardNoticeDays} days' written notice.`
      : `${home.headline} has been withdrawn. There is no withdrawal fee and nothing to pay.`,
    href: "/dashboard",
  });
  refresh();
  redirect("/admin/deals");
}

/** Purchase-order lifecycle: surveyor's invoice arrives, then we pay it. */
export async function adminUpdatePurchaseOrder(formData: FormData) {
  await requireAdmin();
  const po = await getPurchaseOrder(String(formData.get("poId") ?? ""));
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
    await upsertPurchaseOrder(po);
  }
  refresh();
  redirect("/admin/orders");
}

export async function adminMarkInvoicePaid(formData: FormData) {
  await requireAdmin();
  const invoice = await getInvoice(String(formData.get("invoiceId") ?? ""));
  if (invoice && invoice.status === "due") {
    invoice.status = "paid";
    invoice.paidAt = new Date().toISOString();
    await upsertInvoice(invoice);
  }
  refresh();
  redirect("/admin/invoices");
}

export async function adminSaveWeights(formData: FormData) {
  await requireAdmin();
  const current = await matchWeights();
  const next = { ...current };
  for (const key of Object.keys(next) as (keyof typeof next)[]) {
    const v = Number(formData.get(key));
    if (Number.isFinite(v) && v >= 0) next[key] = v;
  }
  await setMatchWeights(next);
  refresh();
  redirect("/admin/settings?saved=1");
}

export async function adminSaveLawyer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("lawyerId") ?? "") || newId();
  await upsertLawyer({
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

// ---- The public Match Report (BUILD-BRIEF.md §6.1) -------------------------

/**
 * Empty-state email capture. Public and unauthenticated by design — the
 * Match Report is the destination for every seller-side advert and must
 * work with no account. Stores a lead; never creates a user, never sends
 * anything yet. The email goes to the database only (match_report_leads),
 * NEVER into the redirect URL.
 */
export async function captureMatchReportLead(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const areaId = String(formData.get("area") ?? "").trim();
  const beds = Math.floor(Number(formData.get("beds") ?? 0));
  const type = String(formData.get("type") ?? "").trim();
  const band = String(formData.get("band") ?? "").trim();

  // Preserve the four inputs through the redirect so the report re-renders.
  const params = new URLSearchParams();
  const area = getArea(areaId);
  if (area) params.set("area", area.id);
  if (beds >= 1) params.set("beds", String(Math.min(beds, 6)));
  if (type) params.set("type", type);
  if (band) params.set("band", band);

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    params.set("error", "email");
    redirect(`/match-report?${params.toString()}`);
  }

  const { PROPERTY_TYPES } = await import("./types");
  await createMatchReportLead({
    email,
    areaId: area?.id ?? null,
    town: area?.place ?? null,
    beds: beds >= 1 ? Math.min(beds, 6) : null,
    propertyType: PROPERTY_TYPES.some((t) => t.value === type) ? type : null,
    valueBand: CONFIG.valueBands.some((b) => b.id === band) ? band : null,
  });

  params.set("saved", "1");
  redirect(`/match-report?${params.toString()}`);
}
