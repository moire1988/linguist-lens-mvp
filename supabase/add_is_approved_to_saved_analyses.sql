-- トップ「みんなの解析」掲載用: 管理者承認フラグ（リンク共有の is_public とは独立）
-- 冪等: 複数回実行しても安全

ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.saved_analyses.is_approved IS
  '管理者が「みんなの解析」への掲載を承認したか。トップ一覧は is_public AND is_approved AND YouTube のみ。';

-- 既存データ: 旧仕様で is_public=true（管理者公開済み）の YouTube 解析は掲載済みとみなす
UPDATE public.saved_analyses
SET is_approved = true
WHERE is_public = true
  AND COALESCE(result_json->>'source_type', '') = 'youtube';

CREATE INDEX IF NOT EXISTS idx_saved_analyses_feed_list
  ON public.saved_analyses (created_at DESC)
  WHERE is_public = true AND is_approved = true;
