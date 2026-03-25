-- ============================================================
-- saved_analyses にアプリが要求する列をすべて追加（冪等）
-- エラー: Could not find the 'is_public' column ... schema cache
-- が出た場合、Supabase Dashboard → SQL Editor で本ファイルを実行してください。
-- 実行後、Dashboard → Settings → API で「Reload schema」を試すとキャッシュが更新されます。
-- ============================================================

-- 公開フラグ（シェア・一覧用）
ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- トップ「注目」用
ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- ユーザーが「みんなの解析に掲載」トグル ON（管理者承認待ち）
ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS public_review_requested BOOLEAN NOT NULL DEFAULT false;

-- ゲスト解析（user_id なし）を許可
ALTER TABLE public.saved_analyses
  ALTER COLUMN user_id DROP NOT NULL;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_saved_analyses_public_created
  ON public.saved_analyses (created_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_saved_analyses_guest
  ON public.saved_analyses (id)
  WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_saved_analyses_featured
  ON public.saved_analyses (created_at DESC)
  WHERE is_featured = true;

-- 未認証でも公開行のみ読める
DROP POLICY IF EXISTS "anon_select_public_analyses" ON public.saved_analyses;
CREATE POLICY "anon_select_public_analyses"
  ON public.saved_analyses
  FOR SELECT
  USING (is_public = true);
