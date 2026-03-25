import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 認証なしの Supabase クライアント（公開データ用）
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Clerk の JWT トークンを付与した認証済み Supabase クライアント。
 * RLS ポリシーで auth.uid() を使うすべてのクエリにこちらを使う。
 *
 * 使い方（Client Component）:
 *   const { getToken } = useAuth();
 *   const token = await getToken({ template: "supabase" });
 *   const client = createAuthClient(token);
 */
export function createAuthClient(token: string | null) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}
