-- ============================================================
-- LinguistLens — Supabase Schema
-- Clerk JWT の sub は auth.jwt() ->> 'sub' で参照（auth.uid() は UUID 型のため Clerk ID で 22P02 になる）
-- Supabase Dashboard > SQL Editor に貼り付けて Run してください
-- ============================================================


-- ─── 1. user_preferences ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id       TEXT        PRIMARY KEY,           -- Clerk "user_..."（uuid 型にすると 22P02）
  voice_accent  TEXT        NOT NULL DEFAULT 'US'
                            CHECK (voice_accent IN ('US', 'UK', 'AU')),
  default_level TEXT        NOT NULL DEFAULT 'B2'
                            CHECK (default_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  wants_email   BOOLEAN     NOT NULL DEFAULT false
);

-- 既存DB向け（CREATE TABLE IF NOT EXISTS で作られた古いテーブル用）
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS wants_email BOOLEAN NOT NULL DEFAULT false;

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
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "insert_own_preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "update_own_preferences" ON public.user_preferences
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK   (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "delete_own_preferences" ON public.user_preferences
  FOR DELETE USING (user_id = (auth.jwt() ->> 'sub'));


-- ─── 2. saved_analyses ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_analyses (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT,                                -- Clerk userId（ゲスト解析は NULL）
  title       TEXT,                               -- 記事・動画タイトル
  url         TEXT,                               -- ソースURL（テキストモード時は NULL）
  video_id    TEXT,                               -- YouTube 11桁 ID（同一動画キャッシュ用）
  content     TEXT,                               -- 解析に使ったテキスト本文
  level       TEXT        NOT NULL
              CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  result_json JSONB       NOT NULL,               -- AIが返した AnalysisResult 全体
  is_public   BOOLEAN     NOT NULL DEFAULT false, -- URL共有（リンクを知る人のみ閲覧可）
  is_approved BOOLEAN     NOT NULL DEFAULT false, -- 管理者承認: トップ「みんなの解析」掲載
  is_featured BOOLEAN   NOT NULL DEFAULT false, -- トップ「注目」用
  public_review_requested BOOLEAN NOT NULL DEFAULT false, -- 「みんなの解析」掲載申請（承認待ち）
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 既存DB向け（古い CREATE で作ったテーブル用）
ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS public_review_requested BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS video_id TEXT;

ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS coach_comment TEXT;

ALTER TABLE public.saved_analyses
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_saved_analyses_video_id_level
  ON public.saved_analyses (video_id, level)
  WHERE video_id IS NOT NULL;

-- ユーザー別・新しい順の検索を高速化
CREATE INDEX IF NOT EXISTS idx_saved_analyses_user_created
  ON public.saved_analyses (user_id, created_at DESC);

-- RLS
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_analyses" ON public.saved_analyses
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "insert_own_analyses" ON public.saved_analyses
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "update_own_analyses" ON public.saved_analyses
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK   (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "delete_own_analyses" ON public.saved_analyses
  FOR DELETE USING (user_id = (auth.jwt() ->> 'sub'));


-- ─── 3. waitlist（Pro プラン Waitlist）────────────────────────
-- Server Action（service_role）のみ書き込み。anon/authenticated からは RLS でブロック。

CREATE TABLE IF NOT EXISTS public.waitlist (
  email      TEXT        NOT NULL PRIMARY KEY,
  user_id    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_user_id
  ON public.waitlist (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_waitlist_created_at
  ON public.waitlist (created_at DESC);

CREATE OR REPLACE TRIGGER trg_waitlist_updated_at
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
