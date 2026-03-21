"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-admin";
import type {
  Article,
  ArticleVocabItem,
  EnglishVariant,
  GenerateCmsArticleResult,
} from "@/lib/article-types";

// ─── CEFR descriptions ───────────────────────────────────────────────────────

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: "complete beginner — very short sentences, present tense only, the 100 most common words",
  A2: "elementary — simple sentences, basic past tense, everyday vocabulary of ~500 words",
  B1: "intermediate — varied sentences, multiple tenses, common idioms, ~2,000-word vocabulary",
  B2: "upper-intermediate — complex sentences, wide vocabulary, phrasal verbs and idioms feel natural",
  C1: "advanced — sophisticated vocabulary, nuanced expression, complex grammar, idiomatic usage",
  C2: "near-native — full vocabulary range, subtle nuance, literary style acceptable",
};

// ─── English variant ─────────────────────────────────────────────────────────

const VARIANTS: EnglishVariant[] = ["US", "UK", "AU", "common"];

const VARIANT_INSTRUCTIONS: Record<EnglishVariant, string> = {
  US:     "Use American English spelling and vocabulary throughout (e.g. color, favorite, apartment, elevator, vacation, trash, soccer).",
  UK:     "Use British English spelling and vocabulary throughout (e.g. colour, favourite, flat, lift, holiday, rubbish, football).",
  AU:     "Use Australian English spelling and vocabulary throughout (e.g. colour, favourite, arvo, biscuit, footpath, servo, ute).",
  common: "Use internationally neutral English with no strong regional bias. Avoid clearly American, British, or Australian slang.",
};

function pickVariant(): EnglishVariant {
  return VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(level: string, variant: EnglishVariant): string {
  const levelDesc = LEVEL_DESCRIPTIONS[level] ?? "intermediate";

  return `You are an expert ESL teacher and a top-tier SEO copywriter. Your task is to generate an engaging English learning article for Japanese learners.

[Parameters]
Target CEFR Level: ${level} — ${levelDesc}
English Variant: ${variant} — ${VARIANT_INSTRUCTIONS[variant]}

═══ STEP 1 — CATEGORY & TOPIC SELECTION (Randomize) ═══════════════════
Pick EXACTLY ONE category, then invent a specific, highly engaging topic within it.
Do NOT use boring textbook topics.

• Tech & Startup             (e.g., Silicon Valley jargon, remote work culture, AI buzzwords)
• Pop Culture & Entertainment (e.g., Netflix slang, music festival vibes, streaming wars)
• Lifehacks & Psychology      (e.g., productivity myths, cognitive biases, sleep science)
• Real Parenting & Family     (e.g., modern parenting in the UK/US, screen time battles)
• Local Travel Secrets        (e.g., hidden cafés in Melbourne, pub etiquette in London)

═══ STEP 2 — SEO STRATEGY ══════════════════════════════════════════════
• Generate a specific, medium-tail "Focus Keyword" in English.
  Good: "Netflix slang English B2", "remote work idioms UK"
  Bad: too broad ("English words") or too narrow ("the exact phrase from one TV show").

• Generate TWO titles — they must describe the SAME article in the SAME format:
  - titleEn: A natural, compelling English title that accurately reflects the article content.
             Example: "The Hidden Cafés You Must Visit in Melbourne"
  - titleJa: A beautiful, natural Japanese translation of titleEn — NOT an SEO-stuffed phrase.
             Translate the meaning faithfully; feel free to paraphrase for elegance.
             ❌ Bad: "メルボルンの隠れカフェで学ぶ英語表現" (SEO-stuffed, unnatural)
             ✅ Good: "メルボルンで絶対に訪れたい隠れ家カフェ" (faithful, natural translation)
             Max 30 Japanese characters.

• CRITICAL — Title/Content format consistency:
  If the article is an essay or narrative, BOTH titles must be essay-style.
  Listicle-style titles ("Top 5 phrases...", "〜表現5選") are ONLY allowed
  if the article body IS actually a numbered list. Never use clickbait titles
  that don't match the body format.

• The slug must be URL-friendly lowercase English, max 60 chars.
  Example: "silicon-valley-slang-b2", "remote-work-idioms-uk"

═══ STEP 3 — CONTENT RULES ═════════════════════════════════════════════
1. Word count: 250–350 words of English body text.
2. CEFR compliance: ALL vocabulary, grammar, and sentence length MUST precisely match ${level}.
3. English variant: Consistently apply ${variant} spelling, vocabulary, and idioms throughout.
4. Opening hook: The very first sentence must be a surprising fact, bold claim, or intriguing question.
5. Style: Engaging magazine article — clear, accurate, enjoyable. Never mention CEFR levels, "English learners", or language study.

═══ STEP 4 — VOCABULARY HIGHLIGHTS ════════════════════════════════════
Select 5–7 key phrasal verbs, idioms, or collocations that are genuinely useful for ${level} learners.
Wrap each one inside the article text in EXACTLY this span format:

  <span class="vocabulary-highlight" data-word="BASE_FORM" data-meaning="日本語訳" data-nuance="ニュアンス解説（1文）" data-example="Short new example sentence.">word as it appears in article</span>

Rules for spans:
  • data-word    → always the dictionary base form (e.g., "burn out" not "burning out")
  • data-meaning → concise Japanese meaning, max 15 characters
  • data-nuance  → brief Japanese nuance/usage tip, max 40 characters
  • data-example → a NEW short sentence different from the article text
  • Double quotes for ALL attribute values. Never use single quotes inside attributes.
  • Do NOT nest spans.

═══ STEP 5 — JAPANESE TRANSLATION ═════════════════════════════════════
Write a fluent, natural Japanese translation of the full article.
Wrap each paragraph in <p>…</p> tags. Plain prose — no annotations, no vocabulary notes.

═══ STEP 6 — CULTURAL TIP ══════════════════════════════════════════════
Write a short Japanese cultural or linguistic tip (2–3 sentences) related to the article's topic or the ${variant} English variant.
This is a "Did you know?" style insight that makes readers think "へぇ！" (Wow, I didn't know that!).

Good examples:
  • "メルボルンは世界有数のコーヒーの街として知られ、バリスタ文化が非常に発達しています。'flat white'はオーストラリア発祥のコーヒーで、現在は世界中のカフェメニューに登場しています。"
  • "'grab a seat'という表現は、アメリカ英語よりもイギリス・オーストラリア英語でより日常的に使われます。フォーマルな場でも自然に使える便利なフレーズです。"
  • "シリコンバレーでは'pivot'（方向転換）という言葉がビジネス文化に深く根付いており、失敗を恥とせず方向転換する姿勢がスタートアップ文化の核心です。"

Rules:
  • Write in natural Japanese (not translated English).
  • Focus on culture, regional language use, etymology, or surprising facts.
  • 2–3 sentences only. No bullet points, no lists.

═══ OUTPUT FORMAT (STRICT JSON) ════════════════════════════════════════
Return ONLY a valid JSON object — no markdown fences, no preamble, absolutely nothing else.
CRITICAL: All string values must be on a single line — use NO raw newlines inside JSON strings.
Use <p>…</p> tags (not \\n) to separate paragraphs in HTML fields.

{
  "keyword": "medium-tail SEO focus keyword in English",
  "category": "Exact category name from the list in Step 1",
  "titleEn": "Natural English title matching the article format",
  "titleJa": "日本語SEOタイトル（最大30文字）",
  "slug": "seo-friendly-english-slug",
  "contentHtml": "<p>Article body with <span class=\\"vocabulary-highlight\\" data-word=\\"word\\" data-meaning=\\"意味\\" data-nuance=\\"ニュアンス\\" data-example=\\"Example sentence.\\">word</span> highlights.</p><p>Second paragraph...</p>",
  "translationHtml": "<p>第1段落の翻訳。</p><p>第2段落の翻訳。</p>",
  "culturalTip": "記事のテーマや${variant}英語に関する文化・語学豆知識（日本語2〜3文）",
  "vocabularyList": [
    {
      "word": "base form",
      "partOfSpeech": "verb",
      "meaning": "日本語訳",
      "nuance": "ニュアンス・使い方のポイント（1文）",
      "dynamicExample": "A natural example sentence using this word.",
      "dynamicExampleTranslation": "例文の自然な日本語訳"
    }
  ]
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
  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!validLevels.includes(level)) {
    return { success: false, error: `無効な CEFR レベルです: ${level}` };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY が設定されていません" };
  }

  const variant = pickVariant();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 4096,
      messages:   [{ role: "user", content: buildPrompt(level, variant) }],
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

  if (!parsed.titleEn || !parsed.contentHtml || !parsed.translationHtml) {
    return {
      success: false,
      error: "AI レスポンスに必須フィールド (titleEn / contentHtml / translationHtml) がありません",
    };
  }

  const rawSlug    = parsed.slug ?? parsed.titleEn;
  const uniqueSlug = await ensureUniqueSlug(rawSlug);

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Supabase 接続に失敗しました（環境変数を確認してください）",
    };
  }

  const insertPayload = {
    slug:             uniqueSlug,
    title_en:         parsed.titleEn.trim(),
    title_ja:         parsed.titleJa?.trim() ?? null,
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
