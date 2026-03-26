"use server";

import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type {
  Article,
  ArticleVocabItem,
  EnglishVariant,
  GenerateCmsArticleResult,
} from "@/lib/article-types";
import {
  ARTICLE_CATEGORIES,
  getArticleCategoryDisplayLabel,
  isGrammarMasterclassCategory,
} from "@/lib/article-categories";

// ─── CEFR descriptions ───────────────────────────────────────────────────────

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: "complete beginner — very short sentences, present tense only, the 100 most common words",
  A2: "elementary — simple sentences, basic past tense, everyday vocabulary of ~500 words",
  B1: "intermediate — varied sentences, multiple tenses, common idioms, ~2,000-word vocabulary",
  B2: "upper-intermediate — complex sentences, wide vocabulary, phrasal verbs and idioms feel natural",
  C1: "advanced — sophisticated vocabulary, nuanced expression, complex grammar, idiomatic usage",
  C2: "near-native — full vocabulary range, subtle nuance, literary style acceptable",
};

// ─── English variant (balanced picker) ──────────────────────────────────────
// Target ratio  US : UK : AU : common = 3 : 1 : 1 : 5

const VARIANT_WEIGHTS: Record<EnglishVariant, number> = {
  US: 3, UK: 1, AU: 1, common: 5,
};

/** 重み付きランダム（DB不可時のフォールバック用） */
function weightedRandomVariant(): EnglishVariant {
  const total = Object.values(VARIANT_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [v, w] of Object.entries(VARIANT_WEIGHTS) as [EnglishVariant, number][]) {
    r -= w;
    if (r <= 0) return v;
  }
  return "common";
}

/**
 * 直近20件の分布を見て目標比率から最も不足しているvariantを選ぶ。
 * DB参照失敗時は重み付きランダムにフォールバック。
 */
async function pickVariantBalanced(
  db: ReturnType<typeof createAdminClient>
): Promise<EnglishVariant> {
  try {
    const { data } = await db
      .from("articles")
      .select("english_variant")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!data || data.length < 4) return weightedRandomVariant();

    const weightTotal = Object.values(VARIANT_WEIGHTS).reduce((a, b) => a + b, 0);
    const targets: Record<string, number> = Object.fromEntries(
      Object.entries(VARIANT_WEIGHTS).map(([v, w]) => [v, w / weightTotal])
    );
    const counts: Record<string, number> = { US: 0, UK: 0, AU: 0, common: 0 };
    for (const row of data as { english_variant: string }[]) {
      if (row.english_variant in counts) counts[row.english_variant]++;
    }
    const n = data.length;

    let best = weightedRandomVariant();
    let bestDeficit = -Infinity;
    for (const v of ["US", "UK", "AU", "common"] as EnglishVariant[]) {
      const deficit = targets[v] - counts[v] / n;
      if (deficit > bestDeficit) { bestDeficit = deficit; best = v; }
    }
    return best;
  } catch {
    return weightedRandomVariant();
  }
}

// ─── Category (balanced picker) ──────────────────────────────────────────────
// 5カテゴリ均等を目標に、直近20件で不足分を優先（旧 category 文字列は表示ラベルへ正規化してカウント）。

async function pickCategoryBalanced(
  db: ReturnType<typeof createAdminClient>
): Promise<string> {
  const categories = ARTICLE_CATEGORIES as readonly string[];
  const target = 1 / categories.length;

  try {
    const { data } = await db
      .from("articles")
      .select("category")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!data || data.length < categories.length) {
      return categories[Math.floor(Math.random() * categories.length)];
    }

    const counts: Record<string, number> = Object.fromEntries(categories.map((c) => [c, 0]));
    for (const row of data as { category: string | null }[]) {
      if (!row.category) continue;
      const canon = getArticleCategoryDisplayLabel(row.category);
      if (canon in counts) counts[canon]++;
    }
    const n = data.length;

    let best = categories[0];
    let bestDeficit = -Infinity;
    for (const cat of categories) {
      const deficit = target - counts[cat] / n;
      if (deficit > bestDeficit) { bestDeficit = deficit; best = cat; }
    }
    return best;
  } catch {
    return categories[Math.floor(Math.random() * categories.length)];
  }
}

/** 英語本文の目標語数（A1/A2 は読む負荷を抑える） */
function getArticleBodyWordCountRange(level: string): string {
  if (level === "A1") return "90–130";
  if (level === "A2") return "130–200";
  return "250–350";
}

/** 各カテゴリの「雑誌コラム」角度（プロンプト用） */
function categoryAngleGuide(cat: string): string {
  const guides: Record<string, string> = {
    "リアルな英語・文法":
      "ネトフリや日常会話で「あ、聞いたことある！」となる一文法・言い回しを1テーマに。日本語とのズレを明るく対比。教科書や論文口調は禁止。",
    "トレンド・スラング":
      "SNS・配信・若者文化のリアルな言い回し。日本のネット文化との違いをフランクに。古いスラング辞典の羅列は避ける。",
    "働き方・ライフスタイル":
      "リモート、会議、カフェ、休日の過ごし方など、実生活で使える英語。日本の職場・生活との違いを楽しく。",
    "恋愛・人間関係":
      "デート、友人、距離感、LINE文化の差など。軽やかで共感できるコラム。重い心理学・社会学的フレームは使わない。",
    海外カルチャーあるある:
      "「え、そうなの？」となる海外の日常・しきたり・空気感。旅行ガイドではなく、在住者目線の小ネタ・あるある。",
  };
  return guides[cat] ?? "日本と海外の文化の違いを、明るく親しみやすい雑誌コラム風に書いてください。";
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(level: string, variant: EnglishVariant, selectedCategory: string): string {
  const levelDesc = LEVEL_DESCRIPTIONS[level] ?? "intermediate";
  const wordRange = getArticleBodyWordCountRange(level);
  const isGrammar = isGrammarMasterclassCategory(selectedCategory);
  const isBeginnerLevel = level === "A1" || level === "A2";
  const angle = categoryAngleGuide(selectedCategory);

  const grammarModeBlock = isGrammar
    ? `
═══ MODE: 「リアルな英語・文法」（英語本文はレッスンエッセイ）════════════
• 英語本文は雑誌コラムのように読みやすい ONE テーマのエッセイ。解説・対比はすべて英語で。
• ${level} に厳密に合わせる。箇条書きルール集にしない。「へぇ、そういう感覚なんだ」を1つに絞る。
• ${variant} のスペル・語彙・イディオムを自然に織り込む。
• 日本語話者がハマるポイントは明るく触れてよい。学術・論文調は禁止。
`
    : "";

  const nonGrammarModeBlock = !isGrammar
    ? `
═══ MODE: カジュアル雑誌コラム（必須）══════════════════════════════════
• 「日本と海外の文化の違い」を軸に、明るく・楽しく・フランクに。
• 角度ガイド: ${angle}
• ${variant} の語彙・スラングを自然に。舞台を海外に固定しない。
`
    : "";

  const step2Rules = isGrammar
    ? `1. Word count: ${wordRange} words of English body（文法エッセイ。説明は英語のまま）。
${isBeginnerLevel ? `   • A1/A2: 1テーマに集中。短くてよい。` : ""}
2. CEFR: ${level} に厳密一致。
3. ${variant} を通篇で一貫。
4. 冒頭は文法・言い回しの「つかみ」。観光・カフェフック禁止。
5. 一続きの英語エッセイ。本文に日本語のルール説明を挟まない。
6. CEFR や「英語学習者」などのメタ言及禁止。`
    : `1. Word count: ${wordRange} words of English body。
${isBeginnerLevel ? `   • A1/A2: 短く、一つの「わかった！」に集中。` : ""}
2. CEFR: ${level} に厳密一致。
3. ${variant} を自然に織り込む。
4. 冒頭は驚き・共感のフック。観光ガイド調禁止。
5. 親しみやすいバイリンガルコラム調。教科書・Wiki・学術分析禁止。`;

  const step3SelectionRule = isGrammar
    ? `ちょうど5件: 句動詞・イディオム・コロケーションまたは文法的塊（${variant} らしく ${level} に合う）。`
    : `ちょうど5件: 句動詞・イディオム・コロケーション（${variant} らしく ${level} に合う）。`;

  const step5Lead = isGrammar
    ? `英語エッセイの「へぇ！」を日本語で2〜3文。明日オンライン英会話で使えそうな実感を。`
    : `記事の ${variant} らしい具体を日本語で2〜3文。「Netflix で聞いたことある！」レベルの具体さ。`;

  const step5GoodExamples = isGrammar
    ? `例: 「ここの would have been は、日本語の『〜だっただろう』より、別の世界線を想像してる感じが強いよね。」`
    : `例: 「アメリカのカフェで隣に軽く声をかけられるの、日本だとびっくりだけど、そこではスモールトークの入り口なんだよね。」`;

  const step5FocusRule = isGrammar
    ? `  • 本文に根ざした一文法・用法に限定。`
    : `  • 本文の表現や場面にひもづける。`;

  return `あなたのペルソナ: 社会学者でも論文ライターでもない。「海外カルチャー好きで親しみやすいバイリンガルの雑誌コラムライター」。読者は日本の英語学習者。

[Parameters]
カテゴリ（JSON の category にそのまま）: ${selectedCategory}
CEFR: ${level} — ${levelDesc}
English variant: ${variant}

═══ 禁止 ═══════════════════════════════════════════════════════════════
• 学術分析・重い社会学、「見えない階級」系の論調やタイトル。
• 観光ガイド・おすすめカフェ・ありきたり自己啓発。
• 教科書付録・ Wikipedia 調の無個性説明。
• titleEn を論文・教科書見出し風にすること（titleEn はサブの英語一行）。

═══ 必須 ═══════════════════════════════════════════════════════════════
• すべてのカテゴリで「日本と海外の文化・コミュニケーションの違い」を、ライトで実践的に。
• 「へぇ！」「明日使ってみよう！」と思わせる具体。上から目線・説教調は禁止。
${isBeginnerLevel ? `• A1/A2: 英語本文 ${wordRange} 語を厳守。` : ""}
${grammarModeBlock}${nonGrammarModeBlock}

═══ DIALECT (${variant}) ═══════════════════════════════════════════════
${variant === "AU" ? `AU 英語・スペル。舞台は澳洲固定でなくてよい。` : ""}
${variant === "UK" ? `British English。` : ""}
${variant === "US" ? `American English。` : ""}
${variant === "common" ? `中立で通じる英語。` : ""}

═══ STEP 1 — keyword / タイトル / slug ═════════════════════════════════
• keyword: 英語の中くらいのフォーカスキーワード。
• titleJa: 【メイン】キャッチーな日本語。疑問形・口語・英語フレーズの引用可。
  ⭕ ネトフリでよく聞く「I'm down」って結局どういう意味？
  ❌ Z世代の若者言葉の裏側（堅い）
  目安: 全角45文字以内。
• titleEn: 【サブ】自然な短い英語一行。学術タイトルにしない。
• slug: 英語小文字・ハイフン、最大60文字（titleEn / keyword 由来）。

═══ STEP 2 — 英語本文 ═══════════════════════════════════════════════
${step2Rules}

═══ STEP 3 — 語彙ハイライト ═══════════════════════════════════════════
${step3SelectionRule}
<span class="vocabulary-highlight" data-word="BASE_FORM" data-meaning="日本語訳" data-nuance="ニュアンス（1文）" data-example="Short new example.">word in text</span>
属性は二重引用符のみ。ネスト禁止。

═══ STEP 4 — 日本語訳 ═══════════════════════════════════════════════
全文の自然な日本語訳。<p>…</p> のみ。

═══ STEP 5 — culturalTip（日本語）═══════════════════════════════════
${step5Lead}
${step5GoodExamples}
${step5FocusRule}
2〜3文。箇条書き禁止。

═══ OUTPUT (STRICT JSON ONLY) ═══════════════════════════════════════
有効な JSON のみ。文字列内に生改行を入れない。

{
  "keyword": "medium-tail keyword in English",
  "category": "${selectedCategory}",
  "titleJa": "メインのキャッチーな日本語タイトル",
  "titleEn": "Supporting English subtitle line",
  "slug": "english-url-slug",
  "contentHtml": "<p>...</p>",
  "translationHtml": "<p>...</p>",
  "culturalTip": "日本語で2〜3文",
  "vocabularyList": [{ "word": "...", "partOfSpeech": "verb", "meaning": "...", "nuance": "...", "dynamicExample": "...", "dynamicExampleTranslation": "..." }]
}`;
}

// ─── Slug の重複回避 ──────────────────────────────────────────────────────────

function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  const slug = sanitizeSlug(base);
  try {
    const db = createAdminClient();
    let suffix = 0;
    while (true) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const { data } = await db
        .from("articles")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (!data) return candidate;
      suffix++;
    }
  } catch {
    // DB 接続不可の場合は timestamp サフィックスで一意性を確保
    return `${slug}-${Date.now()}`;
  }
}

// ─── AI レスポンスのパース ────────────────────────────────────────────────────

interface RawArticleJson {
  keyword?:         string;
  category?:        string;
  titleEn?:         string;
  titleJa?:         string;
  slug?:            string;
  contentHtml?:     string;
  translationHtml?: string;
  culturalTip?:     string;
  vocabularyList?:  ArticleVocabItem[];
}

// JSON文字列値内の生の改行文字を \n エスケープに変換する
function sanitizeJsonString(raw: string): string {
  let inString = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];

    if (escaped) {
      escaped = false;
      result += char;
      continue;
    }
    if (char === "\\" && inString) {
      escaped = true;
      result += char;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    if (inString && char === "\n") {
      result += "\\n";
      continue;
    }
    if (inString && char === "\r") {
      continue;
    }
    result += char;
  }
  return result;
}

function parseAiResponse(raw: string): RawArticleJson {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI レスポンスに JSON が見つかりませんでした");
  return JSON.parse(sanitizeJsonString(match[0])) as RawArticleJson;
}

// ─── Server Action ───────────────────────────────────────────────────────────

const SELECT_COLS =
  "id, slug, title_en, title_ja, level, english_variant, keyword, category, cultural_tip, content_html, translation_html, vocabulary_json, published_at, created_at";

export async function generateCmsArticle(
  level: string,
  publishImmediately = true
): Promise<GenerateCmsArticleResult> {
  // ── Admin guard ────────────────────────────────────────────────────────────
  const { userId } = await auth();
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  if (!userId || !adminId || userId !== adminId) {
    return { success: false, error: "管理者権限が必要です" };
  }

  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!validLevels.includes(level)) {
    return { success: false, error: `無効な CEFR レベルです: ${level}` };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY が設定されていません" };
  }

  // DB クライアントを先に作り、分布参照と保存の両方に使う
  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Supabase 接続に失敗しました（環境変数を確認してください）",
    };
  }

  const variant          = await pickVariantBalanced(db);
  const selectedCategory = await pickCategoryBalanced(db);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 4096,
      messages:   [{ role: "user", content: buildPrompt(level, variant, selectedCategory) }],
    });
    raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Claude API 呼び出しに失敗しました",
    };
  }

  let parsed: RawArticleJson;
  try {
    parsed = parseAiResponse(raw);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? `JSON パースエラー: ${err.message}` : "JSON パースに失敗しました",
    };
  }

  if (
    !parsed.titleEn?.trim() ||
    !parsed.titleJa?.trim() ||
    !parsed.contentHtml ||
    !parsed.translationHtml
  ) {
    return {
      success: false,
      error:
        "AI レスポンスに必須フィールド (titleJa メイン見出し / titleEn 英語サブ / contentHtml / translationHtml) がありません",
    };
  }

  const rawSlug = parsed.slug ?? parsed.titleEn;
  const uniqueSlug = await ensureUniqueSlug(rawSlug);

  const insertPayload = {
    slug:             uniqueSlug,
    title_en:         parsed.titleEn.trim(),
    title_ja:         parsed.titleJa.trim(),
    level,
    english_variant:  variant,
    keyword:          parsed.keyword?.trim() ?? null,
    category:         parsed.category?.trim() ?? null,
    cultural_tip:     parsed.culturalTip?.trim() ?? null,
    content_html:     parsed.contentHtml.trim(),
    translation_html: parsed.translationHtml.trim(),
    vocabulary_json:  parsed.vocabularyList ?? [],
    published_at:     publishImmediately ? new Date().toISOString() : null,
  };

  const { data, error } = await db
    .from("articles")
    .insert(insertPayload)
    .select(SELECT_COLS)
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Supabase への保存に失敗しました",
    };
  }

  const row = data as {
    id: string;
    slug: string;
    title_en: string;
    title_ja: string | null;
    level: string;
    english_variant: EnglishVariant;
    keyword: string | null;
    category: string | null;
    cultural_tip: string | null;
    content_html: string;
    translation_html: string;
    vocabulary_json: ArticleVocabItem[];
    published_at: string | null;
    created_at: string;
  };

  const article: Article = {
    id:              row.id,
    slug:            row.slug,
    titleEn:         row.title_en,
    titleJa:         row.title_ja ?? undefined,
    level:           row.level,
    englishVariant:  row.english_variant,
    keyword:         row.keyword ?? undefined,
    category:        row.category ?? undefined,
    culturalTip:     row.cultural_tip ?? undefined,
    contentHtml:     row.content_html,
    translationHtml: row.translation_html,
    vocabularyList:  row.vocabulary_json,
    publishedAt:     row.published_at,
    createdAt:       row.created_at,
  };

  return { success: true, article };
}
