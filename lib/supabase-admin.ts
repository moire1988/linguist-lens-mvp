/**
 * サーバー専用 Supabase クライアント（サービスロールキー使用）。
 * RLS を完全バイパスするため、Server Actions / Route Handlers 以外では絶対に使わないこと。
 * SUPABASE_SERVICE_ROLE_KEY は NEXT_PUBLIC_ なし → クライアントバンドルに含まれない。
 */
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url            = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
