-- ============================================================
-- saved_expressions — マイ単語帳（Clerk user_id + Supabase）
-- Dashboard > SQL Editor で実行。既存の vocabulary_list から移行する場合は
-- INSERT INTO ... SELECT ... を別途実行してください。
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saved_expressions (
  id                   TEXT        PRIMARY KEY,
  user_id              TEXT        NOT NULL,
  expression           TEXT        NOT NULL,
  type                 TEXT        NOT NULL,
  cefr_level           TEXT        NOT NULL,
  meaning_ja           TEXT        NOT NULL,
  nuance               TEXT        NOT NULL DEFAULT '',
  example              TEXT        NOT NULL DEFAULT '',
  example_translation  TEXT,
  context              TEXT        NOT NULL DEFAULT '',
  why_hard_for_japanese TEXT       NOT NULL DEFAULT '',
  source_url           TEXT,
  source_analysis_id   TEXT,
  status               TEXT        NOT NULL DEFAULT 'learning'
                       CHECK (status IN ('learning', 'archived')),
  saved_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 同一ユーザー内の表現は大文字小文字を区別せず一意
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_expressions_user_expr_lower
  ON public.saved_expressions (user_id, lower(trim(expression)));

CREATE INDEX IF NOT EXISTS idx_saved_expressions_user_saved
  ON public.saved_expressions (user_id, saved_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_expressions_source_analysis
  ON public.saved_expressions (user_id, source_analysis_id)
  WHERE source_analysis_id IS NOT NULL;

ALTER TABLE public.saved_expressions ENABLE ROW LEVEL SECURITY;

-- Clerk JWT の sub と user_id を照合（schema.sql と同パターン）
CREATE POLICY "select_own_saved_expressions" ON public.saved_expressions
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "insert_own_saved_expressions" ON public.saved_expressions
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "update_own_saved_expressions" ON public.saved_expressions
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "delete_own_saved_expressions" ON public.saved_expressions
  FOR DELETE USING (user_id = (auth.jwt() ->> 'sub'));
