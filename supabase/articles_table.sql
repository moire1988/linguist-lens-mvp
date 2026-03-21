-- ============================================================
-- LinguistLens CMS — articles テーブル
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================================

CREATE TABLE IF NOT EXISTS public.articles (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT        NOT NULL UNIQUE,
  title            TEXT        NOT NULL,
  level            TEXT        NOT NULL
                               CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  content_html     TEXT        NOT NULL,       -- 英語本文 HTML（vocabulary-highlight spans 込み）
  translation_html TEXT        NOT NULL,       -- 全文日本語訳 HTML（アコーディオン用）
  vocabulary_json  JSONB       NOT NULL DEFAULT '[]', -- 重要語リスト
  published_at     TIMESTAMPTZ,               -- NULL = 下書き、値あり = 公開済み
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- slug の高速ルックアップ
CREATE INDEX IF NOT EXISTS idx_articles_slug
  ON public.articles (slug);

-- 公開済み記事を新しい順に取得するためのインデックス
CREATE INDEX IF NOT EXISTS idx_articles_published
  ON public.articles (published_at DESC)
  WHERE published_at IS NOT NULL;

-- CEFR レベル別フィルタ
CREATE INDEX IF NOT EXISTS idx_articles_level_published
  ON public.articles (level, published_at DESC)
  WHERE published_at IS NOT NULL;

-- RLS: 公開済み記事は誰でも読める。INSERT/UPDATE/DELETE はサービスロールキーのみ
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_articles"
  ON public.articles
  FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= NOW());
