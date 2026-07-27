// Home Report document storage.
//
// A Home Report contains the full address, the surveyor's valuation and
// details about the seller, so the bucket is PRIVATE: files are never
// reachable by URL. Downloads go through our own route, which checks
// permission per request and then mints a signed link that expires in
// minutes. Nothing here is public, and nothing is guessable.

import { serverDb } from "./supabase";

const BUCKET = "home-reports";
const LINK_TTL_SECONDS = 120;

/** Where a home's report lives. Keyed by home id, so one file per home. */
function storagePath(homeId: string, fileName: string): string {
  // Strip any directory tricks out of the supplied name.
  const safe = fileName.replace(/[^\w.-]+/g, "-").slice(-80);
  return `${homeId}/${safe}`;
}

export async function uploadHomeReportFile(
  homeId: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const path = storagePath(homeId, file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await serverDb()
    .storage.from(BUCKET)
    .upload(path, bytes, {
      contentType: "application/pdf",
      upsert: true, // replacing a wrongly uploaded report overwrites cleanly
    });

  if (error) return { ok: false, message: error.message };
  return { ok: true, path };
}

/**
 * A short-lived link to the stored report. Only call this AFTER checking
 * the caller is allowed it — this function performs no authorisation.
 */
export async function signedHomeReportUrl(
  path: string,
): Promise<string | null> {
  const { data, error } = await serverDb()
    .storage.from(BUCKET)
    .createSignedUrl(path, LINK_TTL_SECONDS, { download: true });
  return error ? null : data.signedUrl;
}

export async function deleteHomeReportFile(path: string): Promise<void> {
  await serverDb().storage.from(BUCKET).remove([path]);
}
