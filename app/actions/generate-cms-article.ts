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
// 4カテゴリ均等 (25% each)。直近20件で最も不足しているカテゴリを優先。

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
      if (row.category && row.category in counts) counts[row.category]++;
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

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(level: string, variant: EnglishVariant, selectedCategory: string): string {
  const levelDesc = LEVEL_DESCRIPTIONS[level] ?? "intermediate";
  const wordRange = getArticleBodyWordCountRange(level);
  const isGrammar = isGrammarMasterclassCategory(selectedCategory);
  const isBeginnerLevel = level === "A1" || level === "A2";

  const grammarModeBlock = isGrammar
    ? `
═══ MODE: ENGLISH GRAMMAR & NUANCE MASTERCLASS (MANDATORY) ═════════════
This category is NOT a culture story. Write the ENTIRE English body as a compelling magazine-style ESSAY in English that teaches ONE deep grammar or usage topic (e.g. why natives reach for this tense, not another; subtle differences between two similar-looking phrases; the "feel" of an aspect or modal in real contexts).
• All explanations, contrasts, and insights in the article body must be in ENGLISH (this is the lesson).
• Still obey ${level} constraints: vocabulary and sentence complexity must match the level.
• Pick one focused angle — avoid shallow lists of rules; aim for "I never thought of it that way!" depth.
• Naturally weave in ${variant}-appropriate vocabulary, spelling, and idioms while discussing grammar.
`
    : "";

  const nonGrammarModeBlock = !isGrammar
    ? `
═══ MODE: CULTURE / TREND / DAILY LIFE (MANDATORY) ═════════════════════
Pick a REAL, slightly niche angle that makes Japanese readers think "I had no idea — I want to tell someone!" — not generic advice.
• Lean into the spirit of: ${selectedCategory}
• Naturally mix in vocabulary, idioms, and spelling that feel authentic to ${variant}.
`
    : "";

  const step2Rules = isGrammar
    ? `1. Word count: ${wordRange} words of English body text (the grammar lesson lives here — all explanations stay in English).
${isBeginnerLevel ? `   • A1/A2: Keep the lesson TIGHT — one focused insight only; do not pad. Shorter text is intentional for reading stamina.` : ""}
2. CEFR compliance: ALL vocabulary, grammar, and sentence length MUST precisely match ${level}.
3. English variant: Consistently apply ${variant} spelling, vocabulary, and idioms throughout — woven into the essay, not bolted on.
4. Opening hook: The very first sentence must grab attention with a bold claim or question about grammar, usage, or native "feel" — never a travel or café hook.
5. The body must read as ONE coherent English essay; do not switch to Japanese to teach rules inside the article.
6. Never mention CEFR levels, "English learners", or language study as meta.`
    : `1. Word count: ${wordRange} words of English body text.
${isBeginnerLevel ? `   • A1/A2: Brevity is a feature — prioritize clarity and one memorable takeaway; avoid long paragraphs that exhaust beginners.` : ""}
2. CEFR compliance: ALL vocabulary, grammar, and sentence length MUST precisely match ${level}.
3. English variant: Consistently apply ${variant} spelling, vocabulary, and idioms throughout — the dialect must be woven naturally into the content, not just mentioned once.
4. Opening hook: The very first sentence must be a surprising fact, bold claim, or intriguing question (culture, trend, or daily life — never a bland tourism teaser).
5. Style: Engaging magazine article — clear, accurate, enjoyable. Never mention CEFR levels, "English learners", or language study.`;

  const step3SelectionRule = isGrammar
    ? `Select exactly 5 items: phrasal verbs, idioms, collocations, OR compact grammatical chunks worth noticing (e.g. a tricky modal stack, a natural collocation) — each must strongly reflect the ${variant} dialect and suit ${level} learners.`
    : `Select exactly 5 phrasal verbs, idioms, or collocations that strongly reflect the ${variant} dialect and target ${level} learners.`;

  const step5Lead = isGrammar
    ? `Explain ONE deep grammar or usage insight from the English essay — in natural Japanese — so readers think "へぇ！そうなんだ！" (Wow, I didn't know that!). Tie it to how ${variant} speakers feel or choose forms.`
    : `Explain ONE specific word or cultural nuance used in the article that relates to the ${variant} dialect.
This should make readers think "へぇ！そうなんだ！" (Wow, I didn't know that!).`;

  const step5GoodExamples = isGrammar
    ? `Good examples (grammar-focused):
  • "このエッセイで出てきた'would have been'は、過去の事実に対する仮定の話し手の距離感を表すときに選ばれます。日本語の「〜だっただろう」とは少しニュアンスが違い、話し手が『もし〜だったら』という世界線を想像している感じが強いです。"
  • "現在完了形と単純過去の違いは、『結果が今も続いているか』だけでなく、話し手が出来事をどう心に置いているかでも変わります。"`
    : `Good examples (dialect-focused):
  • "オーストラリアでは、'a lot'の代わりに'heaps'がよく使われます。「Heaps of people showed up」のように日常会話でごく自然に使われる表現です。"
  • "イギリス英語では、'knackered'は「へとへとに疲れた」という意味で使われます。'tired'よりも感情がこもった表現で、ネイティブが日常的によく口にする言葉です。"
  • "アメリカ英語の'reach out'は元々ビジネス用語でしたが、今では「連絡する」という意味で日常会話にも定着しています。"`;

  const step5FocusRule = isGrammar
    ? `  • Focus on one grammar/usage insight grounded in the English article text (not generic theory).`
    : `  • Focus specifically on a ${variant} word, phrase, spelling difference, or cultural nuance from the article text.`;

  return `You are an expert ESL teacher and a creative editor. Generate a highly engaging English learning article for Japanese learners.

[Parameters]
Category/Topic: ${selectedCategory}
Target CEFR Level: ${level} — ${levelDesc}
English Dialect/Variant: ${variant} (US, UK, AU, or common)

═══ STRICTLY FORBIDDEN (ZERO TOLERANCE) ════════════════════════════════
• Boring tourist-guide content: "best cafés to visit", "hidden gems in [city]", sightseeing tips, restaurant reviews as the main topic.
• Generic self-help clichés: "your brain is sabotaging you", vague motivation without cultural bite, empty positivity.
• Anything that feels like a textbook appendix or a Wikipedia summary with no personality.

═══ REQUIRED (NON-NEGOTIABLE) ═════════════════════════════════════════
• Japanese learners must get a genuine "Aha!" moment: specific, fresh, a little nerdy or insider — still readable at ${level}.
${isBeginnerLevel ? `• A1/A2 reading load: Target English body length is ${wordRange} words (see STEP 2). Do NOT exceed this — beginners rarely have stamina for long texts; the Japanese translation should stay comfortably under ~1,000 characters unless the English is already at the top of the range.` : ""}
• The ${variant} parameter controls spelling, idioms, slang, and lexical choices — NOT where the story is "set". Do not force Sydney/London/New York scenery unless the topic truly needs it.
${grammarModeBlock}${nonGrammarModeBlock}
═══ CRITICAL RULES FOR DIALECT (${variant}) ════════════════════════════
The ${variant} parameter dictates the vocabulary, spelling, idioms, and slang — NOT the geographical setting.

${variant === "AU" ? `Since AU is selected: the piece does NOT need to be about Australia. It must use Australian English patterns (e.g., "mate", "heaps", "reckon", "arvo") and AU/UK spelling (e.g., "colour", "realise") where natural.` : ""}
${variant === "UK" ? `Since UK is selected: use British English — "cheers", "mate", "rubbish", "queue", "knackered", "chuffed", "brilliant", British spelling (e.g., "colour", "favourite", "realise"). Setting can be anywhere.` : ""}
${variant === "US" ? `Since US is selected: use American English spelling and vocabulary (e.g., "color", "favorite", "apartment", "trash", "vacation"). Setting can be anywhere.` : ""}
${variant === "common" ? `Since common is selected: use internationally neutral English with no strong regional slang; keep wording clear and widely understood.` : ""}

═══ CRITICAL RULES FOR CONTENT & ORIGINALITY ═══════════════════════════
Generate a completely fresh, highly specific angle from the category: ${selectedCategory}. No recycled "café in Melbourne" or "brain hacks" templates.

The article must sound natural, modern, and engaging — like a sharp magazine piece, not a textbook.

═══ STEP 1 — SEO STRATEGY ══════════════════════════════════════════════
• Generate a specific, medium-tail "Focus Keyword" in English.
  Good: "Australian slang remote work B2", "UK idioms modern relationships B1"
  Bad: too broad ("English words") or too narrow ("the exact phrase from one TV show").

• Generate TWO titles — they must describe the SAME article in the SAME format:
  - titleEn: A natural, compelling English title that accurately reflects the article content.
  - titleJa: A beautiful, natural Japanese translation of titleEn — NOT an SEO-stuffed phrase.
             Translate the meaning faithfully; feel free to paraphrase for elegance.
             ❌ Bad: "オーストラリア英語で学ぶリモートワーク表現" (SEO-stuffed, unnatural)
             ✅ Good: "在宅勤務でよく使うオーストラリア英語の口癖" (faithful, natural)
             Max 30 Japanese characters.

• CRITICAL — Title/Content format consistency:
  If the article is an essay or narrative, BOTH titles must be essay-style.
  Listicle-style titles ("Top 5 phrases...", "〜表現5選") are ONLY allowed
  if the article body IS actually a numbered list. Never use clickbait titles
  that don't match the body format.

• The slug must be URL-friendly lowercase English, max 60 chars.
  Example: "australian-slang-remote-work-b2", "uk-dating-idioms-b1"

═══ STEP 2 — CONTENT RULES ═════════════════════════════════════════════
${step2Rules}

═══ STEP 3 — VOCABULARY HIGHLIGHTS ════════════════════════════════════
${step3SelectionRule}
Wrap each one inside the article text in EXACTLY this span format:

  <span class="vocabulary-highlight" data-word="BASE_FORM" data-meaning="日本語訳" data-nuance="ニュアンス解説（1文）" data-example="Short new example sentence.">word as it appears in article</span>

Rules for spans:
  • data-word    → always the dictionary base form (e.g., "burn out" not "burning out")
  • data-meaning → concise Japanese meaning, max 15 characters
  • data-nuance  → brief Japanese nuance/usage tip, max 40 characters
  • data-example → a NEW short sentence different from the article text
  • Double quotes for ALL attribute values. Never use single quotes inside attributes.
  • Do NOT nest spans.

═══ STEP 4 — JAPANESE TRANSLATION ═════════════════════════════════════
Write a fluent, natural Japanese translation of the full article.
Wrap each paragraph in <p>…</p> tags. Plain prose — no annotations, no vocabulary notes.

═══ STEP 5 — CULTURAL / GRAMMAR TIP (JAPANESE) ═════════════════════════
${step5Lead}

${step5GoodExamples}

Rules:
  • Write in natural Japanese (not translated English).
${step5FocusRule}
  • 2–3 sentences only. No bullet points, no lists.

═══ OUTPUT FORMAT (STRICT JSON) ════════════════════════════════════════
Return ONLY a valid JSON object — no markdown fences, no preamble, absolutely nothing else.
CRITICAL: All string values must be on a single line — use NO raw newlines inside JSON strings.
Use <p>…</p> tags (not \\n) to separate paragraphs in HTML fields.

{
  "keyword": "medium-tail SEO focus keyword in English",
  "category": "${selectedCategory}",
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
  // ── Admin guard ────────────────────────────────────────────────────────────
  const { userId } = await auth();
  const adminId = process.env.ADMIN_USER_ID;
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

  if (!parsed.titleEn || !parsed.contentHtml || !parsed.translationHtml) {
    return {
      success: false,
      error: "AI レスポンスに必須フィールド (titleEn / contentHtml / translationHtml) がありません",
    };
  }

  const rawSlug    = parsed.slug ?? parsed.titleEn;
  const uniqueSlug = await ensureUniqueSlug(rawSlug);

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
