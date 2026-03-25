-- ============================================================
-- LinguistLens — Supabase Schema
-- Clerk JWT の sub クレームが auth.uid() にマッピングされる前提
-- Supabase Dashboard > SQL Editor に貼り付けて Run してください
-- ============================================================


-- ─── 1. user_preferences ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id       TEXT        PRIMARY KEY,           -- Clerk userId (sub クレーム)
  voice_accent  TEXT        NOT NULL DEFAULT 'US'
                            CHECK (voice_accent IN ('US', 'UK', 'AU')),
  default_level TEXT        NOT NULL DEFAULT 'B2'
                            CHECK (default_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_preferences" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "insert_own_preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "update_own_preferences" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK   (user_id = auth.uid()::text);

CREATE POLICY "delete_own_preferences" ON public.user_preferences
  FOR DELETE USING (user_id = auth.uid()::text);


-- ─── 2. saved_analyses ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_analyses (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT,                                -- Clerk userId（ゲスト解析は NULL）
  title       TEXT,                               -- 記事・動画タイトル
  url         TEXT,                               -- ソースURL（テキストモード時は NULL）
  content     TEXT,                               -- 解析に使ったテキスト本文
  level       TEXT        NOT NULL
              CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  result_json JSONB       NOT NULL,               -- AIが返した AnalysisResult 全体
  is_public   BOOLEAN     NOT NULL DEFAULT false, -- 公開シェア用
  is_featured BOOLEAN   NOT NULL DEFAULT false, -- トップ「注目」用
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ユーザー別・新しい順の検索を高速化
CREATE INDEX IF NOT EXISTS idx_saved_analyses_user_created
  ON public.saved_analyses (user_id, created_at DESC);

-- RLS
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_analyses" ON public.saved_analyses
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "insert_own_analyses" ON public.saved_analyses
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "update_own_analyses" ON public.saved_analyses
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK   (user_id = auth.uid()::text);

CREATE POLICY "delete_own_analyses" ON public.saved_analyses
  FOR DELETE USING (user_id = auth.uid()::text);
