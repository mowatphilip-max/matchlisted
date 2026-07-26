// Cookie session for the prototype: the cookie holds a user id, users live in
// the in-memory store. Production swaps this for Supabase Auth (see README).

import { cookies } from "next/headers";
import { getUser } from "./db";
import type { User } from "./types";

const COOKIE = "ml_uid";

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const uid = jar.get(COOKIE)?.value;
  if (!uid) return null;
  return getUser(uid) ?? null;
}

export async function setSessionUser(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
