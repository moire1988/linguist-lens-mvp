-- 記事カテゴリを旧ラベル（日本語ショート / 英語短文 / 英語長文プレフィックス）から
-- 新5分類へ一括置換する。実行前にバックアップ推奨。
--
-- 新カテゴリ:
--   リアルな英語・文法
--   トレンド・スラング
--   働き方・ライフスタイル
--   恋愛・人間関係
--   海外カルチャーあるある
--
BEGIN;

-- ─── リアルな英語・文法 ─────────────────────────────────────────────────────
UPDATE articles SET category = 'リアルな英語・文法' WHERE category = '文法';
UPDATE articles
SET category = 'リアルな英語・文法'
WHERE category LIKE 'English Grammar & Nuance Masterclass%';

-- ─── トレンド・スラング ─────────────────────────────────────────────────────
UPDATE articles SET category = 'トレンド・スラング' WHERE category IN (
  'ポップ・Z世代',
  'Pop Culture & Entertainment',
  'Pop Culture & Entertainment (e.g., movies, music, internet slang)'
);
UPDATE articles
SET category = 'トレンド・スラング'
WHERE category LIKE 'Pop Culture & Z-Gen Trends%';
UPDATE articles
SET category = 'トレンド・スラング'
WHERE category LIKE 'Pop Culture & Entertainment%';

-- ─── 働き方・ライフスタイル ─────────────────────────────────────────────────
UPDATE articles SET category = '働き方・ライフスタイル' WHERE category IN (
  '仕事・日常',
  'Tech & Startup',
  'Lifehacks & Psychology',
  'Tech & Startup Culture (e.g., remote work, AI tools, silicon valley trends)',
  'Health, Wellness & Food (e.g., diet trends, mental health, workouts)'
);
UPDATE articles
SET category = '働き方・ライフスタイル'
WHERE category LIKE 'Workplace & Daily Survival%';
UPDATE articles
SET category = '働き方・ライフスタイル'
WHERE category LIKE 'Tech & Startup Culture%';
UPDATE articles
SET category = '働き方・ライフスタイル'
WHERE category LIKE 'Health, Wellness & Food%';
UPDATE articles
SET category = '働き方・ライフスタイル'
WHERE category LIKE 'Lifehacks & Psychology%';

-- ─── 恋愛・人間関係 ─────────────────────────────────────────────────────────
UPDATE articles SET category = '恋愛・人間関係' WHERE category IN (
  'Real Parenting & Family',
  'Psychology & Human Behavior (e.g., motivation, habits, communication)',
  'Modern Daily Life & Relationships (e.g., dating, family dynamics, friendships)'
);
UPDATE articles
SET category = '恋愛・人間関係'
WHERE category LIKE 'Psychology & Human Behavior%';
UPDATE articles
SET category = '恋愛・人間関係'
WHERE category LIKE 'Modern Daily Life & Relationships%';

-- ─── 海外カルチャーあるある ─────────────────────────────────────────────────
UPDATE articles SET category = '海外カルチャーあるある' WHERE category IN (
  '文化・社会',
  'Local Travel Secrets'
);
UPDATE articles
SET category = '海外カルチャーあるある'
WHERE category LIKE 'Deep Cultural Nuances & Society%';

COMMIT;
