-- ============================================================
-- saved_analyses に is_public カラムを追加
-- Supabase SQL Editor で実行してください
-- ============================================================

-- カラム追加（既存行はすべて false）
ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 公開行の高速検索用インデックス
CREATE INDEX IF NOT EXISTS idx_saved_analyses_public_created
  ON public.saved_analyses (created_at DESC)
  WHERE is_public = true;

-- 未認証ユーザーが is_public = true の行を SELECT できるポリシー
-- （既存の "select_own_analyses" は認証済みユーザー向けに残す）
CREATE POLICY "anon_select_public_analyses"
  ON public.saved_analyses
  FOR SELECT
  USING (is_public = true);
