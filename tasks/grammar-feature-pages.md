# 実装要件定義書：文法特集ページ群（Grammar Feature Pages）

> **担当**：product-director
> **担当AIへの指示**：このファイルを先頭から順に読み、すべてのステップを実施してください。不明点があっても推測で進めてください。
> **戦略的位置付け**：SEO 経由の自然流入を獲得するための無料公開コンテンツ。
> 「前置詞 英語 感覚」「ing to 使い分け」などの検索クエリで上位表示し、LinguistLens のコア機能（動画解析）への送客ファネルを作る。

---

## 1. ビジネス要件

### 目標
- 「文法 + コアイメージ」系キーワードで月間 1,000 PV 以上のオーガニック流入獲得
- 各ページ末尾 CTA から YouTube 解析ツールへの送客率 5% 以上
- SNS シェア（特に X）の拡散起点コンテンツとして機能させる

### アクセス制御
- **全ページ完全公開**（Guest / Free / Premium すべてアクセス可能）
- Premium ゲートは設けない（SEO 目的のため）
- フレーズの「マイページに保存」ボタンのみログイン状態で挙動が変わる（既存ロジックを流用）

---

## 2. URL 設計

```
/library/grammar               # 特集一覧インデックスページ
/library/grammar/[slug]        # 特集詳細ページ（動的ルート）
```

### slug 命名規則
- すべて小文字、単語はハイフン区切り
- 日本語不使用（ASCII のみ）
- 第一弾：`ing-vs-to`
- 将来候補：`make-vs-do`, `prepositions-core-image`, `causative-verbs`, `articles-a-the`, `phrasal-verbs-up`

---

## 3. データ設計

### 3-1. 型定義ファイル：`lib/grammar-lesson.ts`（新規作成）

`data/grammar-lessons.ts` から型を **re-export** する形で作成。
`data/grammar-lessons.ts` 側に型と実データを置き、`lib/grammar-lesson.ts` では型の公開と取得ユーティリティを提供する。

```typescript
// lib/grammar-lesson.ts
export type {
  VerbPairExample,
  VerbPair,
  GrammarSection,
  PracticeItem,
  GrammarLesson,
} from '@/data/grammar-lessons';
export { GRAMMAR_LESSONS } from '@/data/grammar-lessons';

/** slug からレッスンを取得。見つからない場合は undefined */
export function getGrammarLesson(slug: string): GrammarLesson | undefined {
  return GRAMMAR_LESSONS.find((l) => l.slug === slug);
}

/** `generateStaticParams` 用：全スラッグ一覧 */
export function getAllGrammarSlugs(): string[] {
  return GRAMMAR_LESSONS.map((l) => l.slug);
}
```

### 3-2. データファイル
`data/grammar-lessons.ts` は content-creator が別途作成済み。
このファイルには以下が含まれる：
- `GrammarLesson` 型定義（およびサブ型）
- `export const GRAMMAR_LESSONS: GrammarLesson[]` 配列

---

## 4. ファイル構成（新規作成）

```
app/library/grammar/
  page.tsx                   # 特集一覧ページ（SSG）
  [slug]/
    page.tsx                 # 特集詳細ページ（SSG + generateStaticParams）

components/grammar/
  grammar-concept-card.tsx   # コアイメージ比較カード（A vs B）
  verb-pair-card.tsx         # 動詞ペアカード（accordion）
  grammar-practice.tsx       # インタラクティブ練習問題（Client Component）
  grammar-cta.tsx            # ページ末尾 CTA

lib/grammar-lesson.ts        # 型 re-export + 取得ユーティリティ（新規）
```

---

## 5. SEO 要件（最重要）

### 5-1. `generateMetadata` の実装（`app/library/grammar/[slug]/page.tsx` 内）

```typescript
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const lesson = getGrammarLesson(params.slug);
  if (!lesson) return { title: 'ページが見つかりません' };

  const canonical = `${getPublicSiteUrl()}/library/grammar/${lesson.slug}`;

  return {
    title: lesson.seoTitle,                    // 例: "ingとtoの使い分け｜コアイメージで完全理解 | LinguistLens"
    description: lesson.seoDescription,        // 120〜155字
    keywords: [
      `${lesson.h1}`,
      `英語 ${lesson.category}`,
      `英語 コアイメージ`,
      `CEFR ${lesson.targetLevels.join(' ')}`,
      'linguistlens',
    ],
    openGraph: {
      type: 'article',
      url: canonical,
      title: lesson.seoTitle,
      description: lesson.seoDescription,
      images: [{ url: '/og', width: 1200, height: 630 }],
      publishedTime: lesson.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: lesson.seoTitle,
      description: lesson.seoDescription,
      images: ['/og'],
    },
    alternates: { canonical },
  };
}
```

### 5-2. `generateStaticParams`（同ファイル内）

```typescript
export function generateStaticParams() {
  return getAllGrammarSlugs().map((slug) => ({ slug }));
}
```

### 5-3. JSON-LD 構造化データ（`<script type="application/ld+json">` をページ内に埋め込む）

`app/library/grammar/[slug]/page.tsx` の `<head>` 相当部分（Next.js 14 では `<script>` を JSX に直接書く）：

```tsx
{/* JSON-LD: Article 構造化データ */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: lesson.h1,
      description: lesson.seoDescription,
      datePublished: lesson.publishedAt,
      dateModified: lesson.publishedAt,
      author: {
        '@type': 'Organization',
        name: 'LinguistLens',
        url: getPublicSiteUrl(),
      },
      publisher: {
        '@type': 'Organization',
        name: 'LinguistLens',
        logo: {
          '@type': 'ImageObject',
          url: `${getPublicSiteUrl()}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${getPublicSiteUrl()}/library/grammar/${lesson.slug}`,
      },
    }),
  }}
/>
```

### 5-4. 一覧ページ（`/library/grammar`）の `generateMetadata`

```typescript
export const metadata: Metadata = {
  title: '英語文法コアイメージ特集 | LinguistLens',
  description:
    '前置詞・使役動詞・ingとto・時制など、日本人が感覚的に使いこなせていない英語文法をコアイメージで解説。CEFR B1〜C1対応。',
  alternates: {
    canonical: `${getPublicSiteUrl()}/library/grammar`,
  },
};
```

---

## 6. ページ詳細仕様

### 6-1. 特集詳細ページ（`app/library/grammar/[slug]/page.tsx`）

**レイアウト**：`max-w-3xl mx-auto`（既存の `/articles/[slug]` と統一）

**セクション構成（上から順に）**：

1. **`<SiteHeader>`** + **`<GlobalNav>`**（既存コンポーネント）

2. **パンくずリスト**（既存 `<Breadcrumb>` を使用）
   ```
   Library > 文法コアイメージ特集 > {lesson.h1}
   ```
   - "Library" → `/library`
   - "文法コアイメージ特集" → `/library/grammar`
   - 現在ページ（クリック不可）

3. **ヘッダーブロック**
   - カテゴリバッジ（`lesson.category`、アンバー系）
   - CEFRレベルバッジ群（`lesson.targetLevels.map`）
   - H1: `lesson.h1`
   - サブタイトル: `lesson.subtitle`
   - 読了時間: `{lesson.readingMinutes}分で読める`
   - 公開日

4. **イントロ段落**（`lesson.intro`）

5. **コアコンセプト比較カード**（`<GrammarConceptCard>`）
   - A（ing）と B（to）を横並び（md以上）または縦並び（sm以下）で表示
   - 各カードに：`label`、`coreImage`（大きく強調）、`metaphor`（イタリック）、`keyWords`（タグ形式）

6. **動詞ペアセクション**（`lesson.verbPairs.map` → `<VerbPairCard>`）
   - デフォルト展開（アコーディオン不要。すべて表示）
   - 各カードに：動詞見出し、`coreInsight`、ingImage / toImage の比較ライン、例文テーブル
   - 例文には「✅ 正しい」「⚠️ 注意」「❌ 間違い」のバッジ
   - `scene` に応じたバッジ（"日常" / "ビジネス" / "学術"）

7. **深掘りセクション群**（`lesson.sections.map`）
   - `heading` を H2、`body` を本文（Markdown は簡易パース）
   - `callout` がある場合はインディゴ背景の吹き出しで表示

8. **Pro Tip ブロック**（`lesson.proTip`）
   - 紫グラデーション背景、C1向けのラベル付き

9. **練習問題**（`<GrammarPractice>`、Client Component）
   - 5問の択一問題
   - 選択後に正誤フィードバックと解説を表示
   - 全問正解でスコア表示とCTA誘導

10. **CTA ブロック**（`<GrammarCta>`）
    ```
    🎥 実際のネイティブ音声で "stop doing / stop to do" を耳で確かめよう
    → YouTube URL を貼って LinguistLens で解析する
    ```
    - 「今すぐ解析する」ボタン → `/` にリンク（クエリ不要、トップページ）

11. **関連特集への導線**
    - `lesson.relatedSlugs` に基づく関連ページカード（存在するもののみ）

12. **`<SiteHeader>`** 的なフッター（既存パターンに準拠）

### 6-2. 特集一覧ページ（`app/library/grammar/page.tsx`）

- **SSG（`export const dynamic = 'force-static'`）**
- `GRAMMAR_LESSONS` を全件カード表示
- 各カード：h1、subtitle、targetLevels、category、readingMinutes
- ページヘッダー：「英語文法コアイメージ特集」見出し + 説明文
- 将来の記事が増えた際に自動的に並ぶ

---

## 7. サイトマップ更新（`app/sitemap.ts`）

既存の `sitemap()` 関数に以下を追加してください。
**Supabase への依存は不要**（データが `data/grammar-lessons.ts` に静的に存在するため、常に出力する）。

```typescript
// grammar 特集ページ（静的データ）
import { getAllGrammarSlugs } from '@/lib/grammar-lesson';

// sitemap() 関数内の return の直前に追加:
const grammarIndexRoute: MetadataRoute.Sitemap = [
  {
    url: `${SITE_URL}/library/grammar`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.85,
  },
];

const grammarDetailRoutes: MetadataRoute.Sitemap = getAllGrammarSlugs().map((slug) => ({
  url: `${SITE_URL}/library/grammar/${slug}`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.9,
}));

// return 文を以下に変更:
return [
  ...staticRoutes,
  ...exampleRoutes,
  ...grammarIndexRoute,
  ...grammarDetailRoutes,
  ...shareRoutes,
  ...articleRoutes,
];
```

**注意**：既存の Supabase 依存チェック（`if (!process.env.NEXT_PUBLIC_SUPABASE_URL ...)`）の対象外とすること。grammar ページは静的データのため常に出力する。sitemap 関数を以下の構造に変更：

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const grammarIndexRoute = [...];
  const grammarDetailRoutes = [...];

  // Supabase 依存ルートは既存の条件チェックを維持
  if (/* 既存の Supabase チェック */) {
    return [...grammarIndexRoute, ...grammarDetailRoutes];
  }

  // 通常時は全ルートを結合
  return [
    ...staticRoutes,
    ...exampleRoutes,
    ...grammarIndexRoute,
    ...grammarDetailRoutes,
    ...shareRoutes,
    ...articleRoutes,
  ];
}
```

---

## 8. ルート設定更新（`lib/routes-config.ts`）

`APP_ROUTES` 配列に以下を追加してください（"厳選表現ライブラリ" エントリの直後）：

```typescript
{
  title: '文法コアイメージ特集',
  href: '/library/grammar',
  requiredRole: 'public' as RouteRequiredRole,
  category: 'プロダクト' as RouteCategory,
  permissionDetails: [
    'Guest ✅ ｜ Free ✅ ｜ Premium ✅',
    'SEO 集客用の完全公開コンテンツ。`data/grammar-lessons.ts` の静的データを使用。DB 不要。',
    '`app/library/grammar/[slug]/page.tsx` で `generateStaticParams` により全ページ SSG。',
  ],
},
```

---

## 9. コンポーネント仕様

### `components/grammar/grammar-concept-card.tsx`（Server Component）

```tsx
// props
interface GrammarConceptCardProps {
  label: string;       // "動名詞（-ing）"
  coreImage: string;   // コアイメージ文
  metaphor: string;    // たとえ文
  keyWords: string[];  // キーワード配列
  colorScheme: 'indigo' | 'violet'; // A=indigo, B=violet
}
```

### `components/grammar/verb-pair-card.tsx`（Server Component）

```tsx
interface VerbPairCardProps {
  pair: VerbPair; // lib/grammar-lesson.ts の VerbPair 型
}
```

例文行の構造：
- `isCorrect === false` → 赤背景 + ❌ バッジ
- `warningNote` あり → 黄背景 + ⚠️ バッジ
- 正例 → 白背景 + ✅ バッジ
- `scene` バッジ：daily→"日常"、business→"ビジネス"、academic→"学術"

### `components/grammar/grammar-practice.tsx`（Client Component）

```tsx
'use client';
// props
interface GrammarPracticeProps {
  items: PracticeItem[]; // lib/grammar-lesson.ts の PracticeItem 型
}
```

状態管理：
- `answers: Record<string, number>` — 回答済み問題と選んだ index
- 選択後に `isCorrect` を表示、`explanation` を展開
- 全問完了後に「{正解数}/5 問正解！」と表示
- スコアに応じたメッセージ（5問正解 → "Perfect! ネイティブ感覚が身についています"）

### `components/grammar/grammar-cta.tsx`（Server Component）

```tsx
// インディゴ背景のバナー。
// "実際のネイティブ音声でこの表現を耳で確かめよう" + "/に遷移する「解析してみる」ボタン"
// analytics イベント: trackEvent('grammar_cta_click', { slug })
// → lib/analytics.ts に trackGrammarCtaClick(slug: string) を追加すること
```

---

## 10. アナリティクス拡張（`lib/analytics.ts`）

`lib/analytics.ts` に以下の関数を追加してください（既存関数の後に追記）：

```typescript
/** 文法特集ページのCTAクリック */
export function trackGrammarCtaClick(payload: { slug: string }) {
  track('grammar_cta_click', payload);
}

/** 練習問題の完了 */
export function trackGrammarPracticeCompleted(payload: {
  slug: string;
  score: number;
  total: number;
}) {
  track('grammar_practice_completed', payload);
}
```

---

## 11. 完了チェックリスト

### データ層
- [ ] `lib/grammar-lesson.ts` 新規作成済み（型 re-export + ユーティリティ）
- [ ] `data/grammar-lessons.ts` の `GRAMMAR_LESSONS` が TypeScript エラーなし

### ページ層
- [ ] `app/library/grammar/page.tsx` — 一覧ページ作成済み（`generateMetadata` 付き）
- [ ] `app/library/grammar/[slug]/page.tsx` — 詳細ページ作成済み
  - [ ] `generateMetadata` 実装済み（title, description, OG, twitter, canonical）
  - [ ] `generateStaticParams` 実装済み
  - [ ] JSON-LD `<script>` 埋め込み済み
  - [ ] `notFound()` 処理済み（slug が存在しない場合）
  - [ ] パンくずリスト（Breadcrumb）3段階

### コンポーネント層
- [ ] `components/grammar/grammar-concept-card.tsx` 作成済み
- [ ] `components/grammar/verb-pair-card.tsx` 作成済み
- [ ] `components/grammar/grammar-practice.tsx` 作成済み（Client Component）
- [ ] `components/grammar/grammar-cta.tsx` 作成済み

### SEO・インフラ
- [ ] `app/sitemap.ts` に grammar ルート追加済み
- [ ] `lib/routes-config.ts` に文法特集エントリ追加済み
- [ ] `lib/analytics.ts` に `trackGrammarCtaClick` / `trackGrammarPracticeCompleted` 追加済み

### 品質確認
- [ ] `npm run build` でビルドエラーなし
- [ ] http://localhost:3000/library/grammar でページ表示確認
- [ ] http://localhost:3000/library/grammar/ing-vs-to で詳細ページ表示確認
- [ ] ブラウザで `<title>` タグが `lesson.seoTitle` になっていることを確認
- [ ] `view-source` で `application/ld+json` スクリプトが存在することを確認

---

## 12. 将来の特集ページ候補（slug と狙いキーワード）

| slug | h1 | 狙い検索クエリ |
|---|---|---|
| `make-vs-do` | makeとdoの使い分け | "make do 違い" "make do 英語" |
| `prepositions-core-image` | 前置詞のコアイメージ | "at in on 前置詞 感覚" |
| `causative-verbs` | 使役動詞 make/have/let/get | "使役動詞 英語 違い" |
| `articles-a-the` | 冠詞 a/the のコアイメージ | "a the 使い分け 英語" |
| `phrasal-verbs-up` | 副詞 up のコアイメージ | "up 意味 英語 フレーズ" |

> 各特集は `GRAMMAR_LESSONS` 配列に追加するだけでページが自動生成される（`generateStaticParams` の恩恵）。
