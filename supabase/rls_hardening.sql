-- ============================================================
-- saved_analyses RLS 鉄壁化
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================================

-- ── 既存ポリシーをすべて削除して再定義 ──────────────────────

DROP POLICY IF EXISTS "select_own_analyses"          ON public.saved_analyses;
DROP POLICY IF EXISTS "insert_own_analyses"          ON public.saved_analyses;
DROP POLICY IF EXISTS "update_own_analyses"          ON public.saved_analyses;
DROP POLICY IF EXISTS "delete_own_analyses"          ON public.saved_analyses;
DROP POLICY IF EXISTS "anon_select_public_analyses"  ON public.saved_analyses;

-- ── SELECT ──────────────────────────────────────────────────
-- 公開行（is_public = true）は誰でも読める。
-- それ以外は自分の行のみ。

CREATE POLICY "select_analyses"
  ON public.saved_analyses
  FOR SELECT
  USING (
    is_public = true
    OR auth.uid()::text = user_id
  );

-- ── INSERT ──────────────────────────────────────────────────
-- 認証済みユーザーは自分の行を INSERT できるが、
-- is_public = true では INSERT 不可（サービスロールのみ可）。

CREATE POLICY "insert_own_analyses"
  ON public.saved_analyses
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id
    AND is_public = false
  );

-- ── UPDATE ──────────────────────────────────────────────────
-- 自分の行のみ UPDATE 可。
-- is_public を true に変更することは不可（サービスロールのみ可）。

CREATE POLICY "update_own_analyses"
  ON public.saved_analyses
  FOR UPDATE
  USING  (auth.uid()::text = user_id)
  WITH CHECK (
    auth.uid()::text = user_id
    AND is_public = false
  );

-- ── DELETE ──────────────────────────────────────────────────
CREATE POLICY "delete_own_analyses"
  ON public.saved_analyses
  FOR DELETE
  USING (auth.uid()::text = user_id);
