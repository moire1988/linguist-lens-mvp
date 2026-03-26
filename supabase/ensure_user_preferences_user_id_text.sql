-- ============================================================
-- Clerk ID で 22P02 (invalid input syntax for type uuid) を防ぐ
--
-- 原因は次のどちらか（または両方）:
--   A) user_preferences.user_id が uuid 型のまま
--   B) RLS で auth.uid() を使っている（戻り型が uuid のため sub が UUID 扱いされ 22P02）
--
-- 対処: user_id を TEXT にし、ポリシーは auth.jwt() ->> 'sub' で比較する。
--
-- Supabase Dashboard → SQL Editor で本ファイルをまとめて実行してください。
-- ============================================================

-- ─── A) user_id が uuid のときだけ text へ ───────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_preferences'
      AND column_name = 'user_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.user_preferences
      ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- ─── B) RLS を JWT の sub（文字列）で評価 ───────────────────
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "insert_own_preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "update_own_preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "delete_own_preferences" ON public.user_preferences;

CREATE POLICY "select_own_preferences" ON public.user_preferences
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "insert_own_preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "update_own_preferences" ON public.user_preferences
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "delete_own_preferences" ON public.user_preferences
  FOR DELETE USING (user_id = (auth.jwt() ->> 'sub'));
