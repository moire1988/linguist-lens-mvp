"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-admin";
import type {
  Article,
  ArticleVocabItem,
  EnglishVariant,
  GenerateCmsArticleResult,
} from "@/lib/article-types";

// ─── CEFR 記述 ───────────────────────────────────────────────────────────────

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

// ─── プロンプト ───────────────────────────────────────────────────────────────

function buildPrompt(level: string, variant: EnglishVariant): string {
  const levelDesc = LEVEL_DESCRIPTIONS[level] ?? "intermediate";

  return `You are a professional English content writer creating educational magazine articles for Japanese learners.

Target CEFR Level: ${level} — ${levelDesc}
English Variant: ${variant} — ${VARIANT_INSTRUCTIONS[variant]}

═══ TASK ═══════════════════════════════════════════════════════════════
Write ONE original, engaging, factual English article.
Choose ANY topic that genuinely interests you from these categories:
  • Surprising historical facts that changed the world
  • Unusual cultural traditions from around the globe
  • How a piece of everyday technology actually works
  • Counterintuitive psychology or behavioural science
  • Fascinating animal or nature discoveries
  • Mind-bending geography or space facts
  • Common health myths debunked by science
  • Quirky economic phenomena that affect daily life
  • Unexpected language or linguistics trivia

═══ CONTENT RULES ══════════════════════════════════════════════════════
1. CEFR compliance: ALL vocabulary, grammar, and sentence length MUST match ${level} level precisely.
2. English variant: Consistently apply the ${variant} English rules above — spelling, vocabulary, idioms.
3. Opening hook: The very first sentence must be a surprising fact or intriguing question.
4. Article length: 200–400 words of English body text.
5. Style: Engaging magazine article — clear, accurate, enjoyable. Facts that make readers say "I had no idea!"
6. NEVER mention CEFR, language learning, English learner, or the reader's level.

═══ VOCABULARY HIGHLIGHTS ══════════════════════════════════════════════
Select 5–8 key vocabulary items from your article that are valuable for ${level} learners.
Wrap each one in EXACTLY this span format (copy-paste the structure):

  <span class="vocabulary-highlight" data-word="BASE_FORM" data-meaning="日本語訳" data-nuance="ニュアンス解説（1文）" data-example="Short new example sentence.">word as it appears</span>

Rules for spans:
  • data-word    → always the dictionary base form (e.g., "set off" not "set off early")
  • data-meaning → concise Japanese meaning, max 15 characters
  • data-nuance  → brief Japanese nuance note (usage tip, connotation, or register), max 40 characters
  • data-example → a NEW short sentence (different from the article text)
  • Use double quotes for ALL attribute values. Never use single quotes inside attributes.
  • Do NOT nest spans.

═══ JAPANESE TRANSLATION ════════════════════════════════════════════════
Write a natural, fluent Japanese translation of the full article.
Wrap each paragraph in <p>…</p> tags. Plain prose — no annotations, no vocabulary explanations.

═══ OUTPUT FORMAT ═══════════════════════════════════════════════════════
Return ONLY valid JSON — no markdown fences, no preamble, absolutely nothing else.
CRITICAL: All string values must be on a single line — use NO raw newlines inside JSON strings.
Use <p>…</p> tags (not \\n) to separate paragraphs in HTML fields.

{
  "title": "Catchy, specific title — max 12 words",
  "slug": "url-friendly-lowercase-hyphenated-slug-max-60-chars",
  "contentHtml": "<p>First paragraph with a <span class=\\"vocabulary-highlight\\" data-word=\\"word\\" data-meaning=\\"意味\\" data-nuance=\\"ニュアンス\\" data-example=\\"Example sentence.\\">word</span>.</p><p>Second paragraph...</p>",
  "translationHtml": "<p>第1段落の翻訳。</p><p>第2段落の翻訳。</p>",
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
  const db = createAdminClient();
  let slug = sanitizeSlug(base);
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
}

// ─── AI レスポンスのパース ────────────────────────────────────────────────────

interface RawArticleJson {
  title?:           string;
  slug?:            string;
  contentHtml?:     string;
  translationHtml?: string;
  vocabularyList?:  ArticleVocabItem[];
}

function parseAiResponse(raw: string): RawArticleJson {
  // JSON ブロックを抽出（markdown fences が混入した場合にも対応）
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI レスポンスに JSON が見つかりませんでした");
  return JSON.parse(match[0]) as RawArticleJson;
}

// ─── Server Action ───────────────────────────────────────────────────────────

export async function generateCmsArticle(
  level: string,
  publishImmediately = true
): Promise<GenerateCmsArticleResult> {
  // ── Validate level
  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!validLevels.includes(level)) {
    return { success: false, error: `無効な CEFR レベルです: ${level}` };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "ANTHROPIC_API_KEY が設定されていません" };
  }

  // ── Pick English variant randomly
  const variant = pickVariant();

  // ── Call Claude
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

  // ── Parse JSON
  let parsed: RawArticleJson;
  try {
    parsed = parseAiResponse(raw);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? `JSON パースエラー: ${err.message}` : "JSON パースに失敗しました",
    };
  }

  // ── Validate required fields
  if (!parsed.title || !parsed.contentHtml || !parsed.translationHtml) {
    return {
      success: false,
      error: "AI レスポンスに必須フィールド (title / contentHtml / translationHtml) がありません",
    };
  }

  // ── Slug: AI 生成をベースに重複回避
  const rawSlug  = parsed.slug ?? parsed.title;
  const uniqueSlug = await ensureUniqueSlug(rawSlug);

  // ── Insert into Supabase
  const db = createAdminClient();
  const insertPayload = {
    slug:             uniqueSlug,
    title:            parsed.title.trim(),
    level,
    english_variant:  variant,
    content_html:     parsed.contentHtml.trim(),
    translation_html: parsed.translationHtml.trim(),
    vocabulary_json:  parsed.vocabularyList ?? [],
    published_at:     publishImmediately ? new Date().toISOString() : null,
  };

  const { data, error } = await db
    .from("articles")
    .insert(insertPayload)
    .select("id, slug, title, level, english_variant, content_html, translation_html, vocabulary_json, published_at, created_at")
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
    title: string;
    level: string;
    english_variant: EnglishVariant;
    content_html: string;
    translation_html: string;
    vocabulary_json: ArticleVocabItem[];
    published_at: string | null;
    created_at: string;
  };

  const article: Article = {
    id:              row.id,
    slug:            row.slug,
    title:           row.title,
    level:           row.level,
    englishVariant:  row.english_variant,
    contentHtml:     row.content_html,
    translationHtml: row.translation_html,
    vocabularyList:  row.vocabulary_json,
    publishedAt:     row.published_at,
    createdAt:       row.created_at,
  };

  return { success: true, article };
}
