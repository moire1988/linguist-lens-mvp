# X投稿スクリプト改修指示書

> レビュアー: @cgo-growth-hacker + @content-creator（2026-03-29）
> 目的: XタイムラインからLinguistLensへのCTRを最大化する
> 対象: `scripts/post-to-x.ts`

---

## 現状の課題サマリ

| # | 問題 | 深刻度 | CTR影響 |
|---|------|--------|---------|
| C1 | 文字数上限140（実際は280） | 高 | スペース50%無駄 |
| C2 | 毎回同じフォーマット | 高 | バナーブラインドネス |
| C3 | CTA静的・弱い・URLがトップページのみ | 高 | クリック動機ゼロ |
| C4 | 文法特集ページが一切投稿されない | 中 | SEO連動機会の損失 |
| C5 | フック公式が未使用 | 高 | 好奇心ギャップなし |
| C6 | badExample / why_hard_for_japanese 未使用 | 中 | 最も面白いデータを使っていない |

---

## 改善後の投稿フォーマット設計

### フォーマット A：クイズ型（推奨頻度 35%）

```
【英語クイズ】どちらが自然？

A. [badExample or warnExample]
B. [goodExample]

正解は↓のリプライで
#英語 #LinguistLens
```

**リプライ（CTA）:**
```
正解: B ✅

[why_hard_for_japanese を1〜2文に要約]

🔍 コアイメージで150表現を解説中
→ [context_url]
```

**狙い:** クイズは「答えを知りたい」衝動でリプライ展開→インプレッション2倍。クリック先URLも自然に誘導。

---

### フォーマット B：反直感・NG対比型（推奨頻度 30%）

```
日本人が使いがちな英語 ⚠️

× "[badExample]"
○ "[goodExample]"

なぜ違うのか？

[expression] の核心イメージ：
[coreImage を1文に凝縮]

#英語学習 #LinguistLens
```

**リプライ（CTA）:**
```
[context]のシーンでそのまま使えます

似た表現との使い分けは↓
→ [context_url]
```

**狙い:** 「失敗恐怖 × 正解欲求」は最も強いエンゲージメント動機。「自分も間違えてた！」でRT。

---

### フォーマット C：文法特集ページ告知型（推奨頻度 20%）

```
英語のコアイメージ特集 📖

[h1 of grammar lesson]

[intro の最初の1〜2文を引用]

詳しく→ [grammar page URL]

#英語文法 #LinguistLens
```

**リプライ（CTA）:**
```
ミニクイズつきで解説しています
[practice question の1問目だけ抜粋]
→ 全5問: [grammar page URL]
```

**狙い:** 文法特集ページへの直接誘導。「クイズつき」という具体的な価値を提示。

---

### フォーマット D：好奇心ギャップ型（推奨頻度 15%）

```
「[meaning_ja]」を英語で言うと？

実は [expression] って言うんですよ。

🧠 なぜその組み合わせで
その意味になるのか

[coreImage を2〜3文で展開]

#英語 #TOEIC #LinguistLens
```

**リプライ（CTA）:**
```
[context] でそのまま使える例文：

"[goodExample]"
→ [goodExampleJa]

同じシーンの関連表現を↓のライブラリで
[context_url]
```

**狙い:** "実は" という好奇心トリガー。答えを先に示してからコアを展開する逆張り構成。

---

## スクリプト改修指示（Cursor 向け）

### 1. 定数の変更

```typescript
// Before
const PARENT_TWEET_MAX = 140;

// After
const PARENT_TWEET_MAX = 270;  // Xの上限280から余白を10確保
const REPLY_TWEET_MAX = 270;
```

---

### 2. URLルーティングの動的化

```typescript
const SITE_URL = "https://linguistlens.app";

// 追加
const GRAMMAR_PAGE_BASE = `${SITE_URL}/library/grammar`;
const LIBRARY_PAGE = `${SITE_URL}/library`;

/** コンテンツの種類に応じたリンク先を返す */
function resolveCtaUrl(
  source: ContentSource
): string {
  if (source.type === "grammar_lesson") {
    return `${GRAMMAR_PAGE_BASE}/${source.slug}`;
  }
  // library entry: /library にフォールバック
  return LIBRARY_PAGE;
}
```

---

### 3. `TweetFormat` 型と重み付き選択の追加

```typescript
type TweetFormat = "quiz" | "ng_contrast" | "grammar_page" | "curiosity_gap";

/** 重み付きランダムでフォーマットを選択 */
function pickTweetFormat(source: ContentSource): TweetFormat {
  // grammar_lesson は grammar_page フォーマットを優先
  if (source.type === "grammar_lesson") return "grammar_page";

  const weights: [TweetFormat, number][] = [
    ["quiz", 35],
    ["ng_contrast", 30],
    ["curiosity_gap", 20],
    // grammar_page は grammar_lesson ソース専用なので library エントリでは除外
  ];

  // badExample がない場合は ng_contrast を除外
  const entry = source.entry;
  const filtered = (entry?.badExample || entry?.warnExample)
    ? weights
    : weights.filter(([f]) => f !== "ng_contrast");

  const total = filtered.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [format, w] of filtered) {
    r -= w;
    if (r <= 0) return format;
  }
  return "curiosity_gap";
}
```

---

### 4. `ContentSource` 型の追加（library / grammar_lesson 両対応）

```typescript
type ContentSource =
  | { type: "library"; entry: LibraryEntry }
  | { type: "grammar_lesson"; slug: string; lesson: GrammarLessonSummary };

/** 文法レッスンの投稿用サマリ型 */
interface GrammarLessonSummary {
  slug: string;
  h1: string;
  intro: string;
  practiceItems: { prompt: string; options: string[]; correctIndex: number; explanation: string }[];
}
```

---

### 5. 文法レッスンデータの読み込み追加

```typescript
/** data/grammar-lessons.ts から投稿用サマリを抽出 */
function loadGrammarLessonSummaries(): GrammarLessonSummary[] {
  // Next.js の data/grammar-lessons.ts を直接 import（ts-node or tsx で実行想定）
  // Note: GitHub Actions では tsx で実行するため dynamic import か require で読む
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GRAMMAR_LESSONS } = require("../data/grammar-lessons") as {
      GRAMMAR_LESSONS: Array<{
        slug: string;
        h1: string;
        intro: string;
        practiceItems: GrammarLessonSummary["practiceItems"];
      }>;
    };
    return GRAMMAR_LESSONS.map((l) => ({
      slug: l.slug,
      h1: l.h1,
      intro: l.intro,
      practiceItems: l.practiceItems,
    }));
  } catch {
    console.warn("[post-to-x] grammar-lessons の読み込み失敗。library のみ使用");
    return [];
  }
}

/**
 * コンテンツソースを選択する（library 80% / grammar_lesson 20% の比率）
 * grammar lesson は posted_history にスラッグで記録する（重複回避）
 */
function pickContentSource(
  library: LibraryEntry[],
  grammarLessons: GrammarLessonSummary[],
  history: Set<string>
): ContentSource {
  const useGrammar =
    grammarLessons.length > 0 && Math.random() < 0.20;

  if (useGrammar) {
    const available = grammarLessons.filter((l) => !history.has(`grammar:${l.slug}`));
    const pool = available.length > 0 ? available : grammarLessons;
    const lesson = pickRandom(pool);
    return { type: "grammar_lesson", slug: lesson.slug, lesson };
  }

  const available = library.filter((i) => !history.has(i.expression));
  const pool = available.length > 0 ? available : library;
  return { type: "library", entry: pickRandom(pool) };
}
```

---

### 6. フォーマット別プロンプトへの変更

現在の `generateParentTweetGroq()` を以下に置き換える:

```typescript
async function generateParentTweetGroq(
  source: ContentSource,
  format: TweetFormat
): Promise<{ parent: string; reply: string }> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const ctaUrl = resolveCtaUrl(source);

  const systemContent =
    "あなたはCTR最大化のプロのSNSコピーライターであり、認知言語学に基づく英語教育の専門家です。X（Twitter）で英語学習者のエンゲージメントを最大化するツイートを書いてください。";

  const userContent = buildPrompt(source, format, ctaUrl);

  const res = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.85,   // 多様性を上げる
      max_tokens: 500,
    }),
  });
  // ...（既存のエラーハンドリングは維持）

  // レスポンスを PARENT / REPLY の2パートに分割
  // → プロンプトで区切り文字 "---REPLY---" を指定して分割
  const text = extractGroqAssistantText(parsed).trim();
  const parts = text.split("---REPLY---");
  const parent = (parts[0] ?? text).trim().slice(0, PARENT_TWEET_MAX);
  const reply = (parts[1] ?? ctaUrl).trim().slice(0, REPLY_TWEET_MAX);
  return { parent, reply };
}
```

---

### 7. `buildPrompt()` 関数の追加

```typescript
function buildPrompt(
  source: ContentSource,
  format: TweetFormat,
  ctaUrl: string
): string {
  if (source.type === "grammar_lesson") {
    return buildGrammarLessonPrompt(source.lesson, ctaUrl);
  }
  const entry = source.entry;
  switch (format) {
    case "quiz":        return buildQuizPrompt(entry, ctaUrl);
    case "ng_contrast": return buildNgContrastPrompt(entry, ctaUrl);
    case "curiosity_gap": return buildCuriosityGapPrompt(entry, ctaUrl);
    default:            return buildCuriosityGapPrompt(entry, ctaUrl);
  }
}

// ── フォーマット A: クイズ型 ──────────────────────────────
function buildQuizPrompt(entry: LibraryEntry, ctaUrl: string): string {
  return `次の英語フレーズ「${entry.expression}」（意味: ${entry.meaning_ja}）を使ったX（Twitter）投稿を作成してください。

【フォーマット: クイズ型】
親ツイート（270文字以内）は以下の構成で：
1. 冒頭に「【英語クイズ】どちらが自然？」と書く
2. A. ${entry.badExample ?? entry.warnExample ?? "(不自然な例を考える)"}
3. B. ${entry.goodExample}
4. 「正解は↓リプライで」で締める
5. 末尾に #英語 #LinguistLens

リプライ（270文字以内）は以下の構成で：
1. 「正解: B ✅」
2. なぜAが不自然か1〜2文（why_hard_for_japanese の要点: ${entry.why_hard_for_japanese}）
3. CTA: 「コアイメージで150表現を解説中 → ${ctaUrl}」

親ツイートとリプライを "---REPLY---" という文字列で区切って出力してください。`;
}

// ── フォーマット B: NG対比型 ──────────────────────────────
function buildNgContrastPrompt(entry: LibraryEntry, ctaUrl: string): string {
  return `次の英語フレーズ「${entry.expression}」（意味: ${entry.meaning_ja}）を使ったX投稿を作成してください。

【フォーマット: NG対比型】
親ツイート（270文字以内）:
1. 冒頭「日本人が使いがちな英語 ⚠️」または「日本人が間違えやすい英語」
2. × "${entry.badExample ?? entry.warnExample ?? "(不自然な例)"}"
3. ○ "${entry.goodExample}"
4. コアイメージ1文（素材: ${entry.coreImage}）
5. #英語学習 #LinguistLens

リプライ（270文字以内）:
1. nuance を1〜2文（素材: ${entry.nuance}）
2. context（使用シーン: ${entry.context}）
3. CTA: 「なぜそうなるのかコアイメージで解説 → ${ctaUrl}」

"---REPLY---" で区切って出力してください。`;
}

// ── フォーマット D: 好奇心ギャップ型 ─────────────────────
function buildCuriosityGapPrompt(entry: LibraryEntry, ctaUrl: string): string {
  return `次の英語フレーズ「${entry.expression}」（意味: ${entry.meaning_ja}）を使ったX投稿を作成してください。

【フォーマット: 好奇心ギャップ型】
親ツイート（270文字以内）:
1. 「「${entry.meaning_ja}」を英語で言うと？」または「ネイティブはなぜ〜と言うのか」から始める
2. 答え（フレーズ）を提示
3. コアイメージを2〜3文で展開（素材: ${entry.coreImage} / ${entry.nuance}）
4. #英語 #TOEIC #LinguistLens

リプライ（270文字以内）:
1. 例文: "${entry.goodExample}"（和訳: ${entry.goodExampleJa}）
2. why_hard_for_japanese の要点1文: ${entry.why_hard_for_japanese}
3. CTA: 「同じシーンの関連表現はこちら → ${ctaUrl}」

"---REPLY---" で区切って出力してください。`;
}

// ── フォーマット C: 文法特集告知型 ───────────────────────
function buildGrammarLessonPrompt(
  lesson: GrammarLessonSummary,
  ctaUrl: string
): string {
  const quiz = lesson.practiceItems[0];
  return `文法特集ページ「${lesson.h1}」の告知ツイートを作成してください。

【フォーマット: 文法特集告知型】
親ツイート（270文字以内）:
1. タイトル「${lesson.h1}」を含める
2. introの冒頭1〜2文を引用・要約: ${lesson.intro.slice(0, 100)}…
3. 「ミニクイズつき・無料」と価値を伝える
4. CTA: 「→ ${ctaUrl}」
5. #英語文法 #英語 #LinguistLens

リプライ（270文字以内）:
1. ミニクイズ1問を抜粋:
   "${quiz?.prompt ?? "コアイメージを問うクイズ"}"
   ${quiz?.options.map((o, i) => `${["A","B","C","D"][i]}. ${o}`).join(" / ") ?? ""}
2. 「全5問のクイズはこちら → ${ctaUrl}」

"---REPLY---" で区切って出力してください。`;
}
```

---

### 8. `recordPostedPhrase()` の汎用化

```typescript
/** 投稿記録のキー: library は expression、grammar は "grammar:{slug}" */
function resolveHistoryKey(source: ContentSource): string {
  return source.type === "grammar_lesson"
    ? `grammar:${source.slug}`
    : source.entry.expression;
}

// main() での呼び出し変更:
// Before: recordPostedPhrase(item.expression);
// After:  recordPostedPhrase(resolveHistoryKey(source));
```

---

### 9. `main()` の変更

```typescript
async function main(): Promise<void> {
  const library = loadLibrary();
  const grammarLessons = loadGrammarLessonSummaries();
  const historyArr = readPostedHistory();
  const historySet = new Set(historyArr);

  const source = pickContentSource(library, grammarLessons, historySet);
  const format = pickTweetFormat(source);

  const label =
    source.type === "grammar_lesson"
      ? `grammar:${source.slug}`
      : `[${source.entry.level}] ${source.entry.expression}`;
  console.log(`Picked: ${label} | Format: ${format}`);

  const { parent, reply } = await generateParentTweetGroq(source, format);
  console.log("--- Parent ---\n", parent, "\n---");
  console.log("--- Reply ---\n", reply, "\n---");

  const { parentId, replyId } = await postThreadToX(parent, reply);
  recordPostedPhrase(resolveHistoryKey(source));
  console.log(`Posted thread. Parent: ${parentId} | Reply: ${replyId}`);
}
```

---

### 10. `posted_history.json` のキー形式変更に伴う注意

既存の履歴は `{ phrases: ["expression", ...] }` 形式。
grammar スラッグは `"grammar:slug"` 形式で同じ配列に混在させてよい（文字列なので衝突しない）。

---

## 投稿フォーマット比較（Before / After）

### Before（現状）
```
🔹 bring to the table
意味: 貢献する・価値を持ち込む

🧠 コアイメージ
会議のテーブルに何かを持ってくる→貢献するというイメージ

💡 例文
What can you bring to the table in this role?

#LinguistLens
```
▲ 毎回同じ構造・フックなし・CTA弱

---

### After（フォーマットA: クイズ型）
```
【英語クイズ】どちらが自然？

A. "What can you contribute to our company?"
B. "What can you bring to the table?"

自然なのはBです。理由は↓
正解: B ✅

ネイティブは「貢献する」を "contribute" より
"bring to the table" で表現します。
テーブルに価値を「持ち込む」という視覚イメージが
直感的で記憶に残りやすい。

ビジネス英語150表現のコアイメージをまとめました
→ https://linguistlens.app/library
```

---

### After（フォーマットC: 文法特集告知型）
```
英語のコアイメージ特集 📖

「使役動詞（make/let/have/get）の違い」

「彼に確認させた」を英語にすると
make/have/get の3択。どれを選ぶ？

実は「強制・許可・依頼・説得」の
スペクトルで使い分けている。

ミニクイズつき・無料解説
→ https://linguistlens.app/library/grammar/causative-verbs-make-let-have-get
↓ クイズ1問目
どちらが自然？
A. "I made my colleague to stay late."
B. "I made my colleague stay late."
→ 全5問: 上のリンクから
```

---

## 実装優先順位

| 優先度 | 変更 | 工数 |
|--------|------|------|
| P0 | `PARENT_TWEET_MAX = 270` に変更 | 1行 |
| P0 | `buildReplyText()` を動的化（URLを content に応じて変える） | 小 |
| P1 | フォーマット型の追加と重み付き選択 | 中 |
| P1 | フォーマット別プロンプト（buildXxxPrompt）実装 | 中 |
| P2 | 文法レッスンデータの読み込みと grammar_page フォーマット | 中 |
| P2 | `resolveHistoryKey()` で grammar slug も記録 | 小 |

P0 だけでも即日でCTRが改善する可能性が高い（文字数×価値密度）。
