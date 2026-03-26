-- ============================================================
-- saved_analyses: AI コーチコメント（解析と同一レスポンスで生成）
-- Supabase Dashboard → SQL Editor で実行（冪等）
-- ============================================================

ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS coach_comment TEXT;

COMMENT ON COLUMN public.saved_analyses.coach_comment IS
  '動画・テキスト解析時に AI が生成したコーチからの短い励ましコメント（日本語）。result_json にも含まれる場合あり。';
