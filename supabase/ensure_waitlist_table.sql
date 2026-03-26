-- ============================================================
-- public.waitlist（Pro Waitlist 登録）
-- エラー: Could not find the table 'public.waitlist' in the schema cache
-- → Supabase Dashboard → SQL Editor で実行。実行後 Settings → API で Reload schema を推奨。
-- app/actions/waitlist.ts が email / user_id で upsert（onConflict: email）します。
-- ============================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  email      TEXT        NOT NULL PRIMARY KEY,
  user_id    TEXT,       -- Clerk user_...（ゲストは NULL）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_user_id
  ON public.waitlist (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_waitlist_created_at
  ON public.waitlist (created_at DESC);

-- updated_at 自動更新（schema.sql の set_updated_at を再利用）
DROP TRIGGER IF EXISTS trg_waitlist_updated_at ON public.waitlist;
CREATE TRIGGER trg_waitlist_updated_at
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 直アクセスは service_role のみ想定（Server Action の createAdminClient）
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
