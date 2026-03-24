-- ============================================================
-- saved_analyses テーブルの変更
-- 1. user_id を NULL 許容にする（ゲスト解析対応）
-- 2. is_featured カラムを追加する（トップページ掲載フラグ）
-- Supabase Dashboard > SQL Editor に貼り付けて Run してください
-- ============================================================

-- 1. user_id を NOT NULL → nullable に変更
--    （ゲストユーザーの解析を user_id = NULL で保存するため）
ALTER TABLE public.saved_analyses
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. is_featured カラムを追加（既に存在する場合はスキップ）
ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 3. ゲスト解析の高速アクセス用インデックス
CREATE INDEX IF NOT EXISTS idx_saved_analyses_guest
  ON public.saved_analyses (id)
  WHERE user_id IS NULL;

-- 4. is_featured インデックス（トップページ掲載用）
CREATE INDEX IF NOT EXISTS idx_saved_analyses_featured
  ON public.saved_analyses (created_at DESC)
  WHERE is_featured = true;
