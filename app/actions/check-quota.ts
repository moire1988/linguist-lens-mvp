"use server";

import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase-admin";

// ─── Config ───────────────────────────────────────────────────────────────────

const ANALYSIS_DAILY_LIMIT = 1;  // guest & free tier: 1/day per session
const IP_DAILY_LIMIT        = 5; // guest tier: 5/day per IP (all browsers)

const GUEST_COOKIE = "ll_qg"; // httpOnly — not readable client-side

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ─── IP helpers ───────────────────────────────────────────────────────────────

function getClientIP(): string {
  const h = headers();
  return (
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** localhost / private-range IPs → skip IP quota (dev environment) */
function isLocalIP(ip: string): boolean {
  return (
    ip === "unknown"  ||
    ip === "127.0.0.1" ||
    ip === "::1"
  );
}

/** One-way hash for storage — IP is never stored in plaintext */
function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

// ─── Action ───────────────────────────────────────────────────────────────────

/**
 * Checks the daily analysis quota for the current requester.
 *
 * Guest  → cookie check (1/day per browser)
 *           + IP check  (5/day per IP — catches incognito / multi-browser)
 * Free   → Supabase user_quotas (1/day, identity-bound)
 * Pro    → always allowed (placeholder; billing not live yet)
 */
export async function consumeQuotaAction(): Promise<{
  allowed: boolean;
  isLoggedIn: boolean;
}> {
  const { userId } = await auth();
  const today = todayUTC();

  // ── Guest ─────────────────────────────────────────────────────────────────
  if (!userId) {
    // 1. Cookie check (fast, no DB)
    const jar = cookies();
    const raw = jar.get(GUEST_COOKIE)?.value;
    let rec: { d: string; n: number } = { d: "", n: 0 };
    try { if (raw) rec = JSON.parse(raw) as { d: string; n: number }; } catch { /* ignore */ }

    const cookieCount = rec.d === today ? rec.n : 0;
    if (cookieCount >= ANALYSIS_DAILY_LIMIT) {
      return { allowed: false, isLoggedIn: false };
    }

    // 2. IP check via Supabase (skipped for localhost / dev)
    const ip = getClientIP();
    if (!isLocalIP(ip)) {
      let db;
      try { db = createAdminClient(); } catch { /* fail open */ }

      if (db) {
        const ipHash = hashIP(ip);

        const { data: ipRow } = await db
          .from("ip_quotas")
          .select("count")
          .eq("ip_hash", ipHash)
          .eq("date", today)
          .maybeSingle();

        const ipCount = (ipRow as { count: number } | null)?.count ?? 0;
        if (ipCount >= IP_DAILY_LIMIT) {
          return { allowed: false, isLoggedIn: false };
        }

        // Increment IP count
        await db
          .from("ip_quotas")
          .upsert(
            { ip_hash: ipHash, date: today, count: ipCount + 1 },
            { onConflict: "ip_hash,date" }
          );
      }
    }

    // 3. Increment cookie count
    jar.set(GUEST_COOKIE, JSON.stringify({ d: today, n: cookieCount + 1 }), {
      path: "/",
      maxAge: 60 * 60 * 48, // 48h (safely spans midnight)
      httpOnly: true,
      sameSite: "lax",
    });
    return { allowed: true, isLoggedIn: false };
  }

  // ── Pro (placeholder) ─────────────────────────────────────────────────────
  // TODO: check user_preferences.is_pro once billing is live
  const isPro = false;
  if (isPro) return { allowed: true, isLoggedIn: true };

  // ── Free logged-in ────────────────────────────────────────────────────────
  let db;
  try {
    db = createAdminClient();
  } catch {
    return { allowed: true, isLoggedIn: true }; // fail open
  }

  const { data } = await db
    .from("user_quotas")
    .select("count")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  const current = (data as { count: number } | null)?.count ?? 0;
  if (current >= ANALYSIS_DAILY_LIMIT) {
    return { allowed: false, isLoggedIn: true };
  }

  await db
    .from("user_quotas")
    .upsert(
      { user_id: userId, date: today, count: current + 1 },
      { onConflict: "user_id,date" }
    );

  return { allowed: true, isLoggedIn: true };
}
