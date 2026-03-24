"use server";

import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { isGrammarMasterclassCategory, pickArticleCategory } from "@/lib/article-categories";

// ─── Types ──────────────────────────────────────────────────────────────────

export type GenerateArticleResult =
  | { success: true; title: string; body: string }
  | { success: false; error: string };

// ─── CEFR descriptions for the prompt ───────────────────────────────────────

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: "complete beginner — very short sentences, present tense only, the 100 most common words",
  A2: "elementary — simple sentences, basic past tense, everyday vocabulary of about 500 words",
  B1: "intermediate — varied sentences, multiple tenses, common idioms, ~2 000-word vocabulary",
  B2: "upper-intermediate — complex sentences, wide vocabulary, phrasal verbs and idioms natural",
  C1: "advanced — sophisticated vocabulary, nuanced expression, complex grammar, idiomatic usage",
  C2: "near-native — full vocabulary range, subtle nuance, literary style acceptable",
};

// ─── Accent / English variant instructions ───────────────────────────────────

const ACCENT_INSTRUCTIONS: Record<string, string> = {
  US: "Use American English throughout: spelling (color, favorite, analyze, center), vocabulary (apartment, elevator, vacation, trash, soccer, gas station, freeway), and idioms typical in American daily life.",
  UK: "Use British English throughout: spelling (colour, favourite, analyse, centre), vocabulary (flat, lift, holiday, rubbish, football, petrol station, motorway), and idioms typical in British daily life.",
  AU: "Use Australian English throughout: spelling (colour, favourite, analyse, centre), vocabulary and idioms typical in Australian daily life (arvo, biscuit, footpath, servo, ute, heaps, reckon).",
};

// ─── Server Action ───────────────────────────────────────────────────────────

export async function generateArticle(
  cefrLevel: string,
  accent: string = "US"
): Promise<GenerateArticleResult> {
  // ── Admin guard ────────────────────────────────────────────────────────────
  const { userId } = await auth();
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  if (!userId || !adminId || userId !== adminId) {
    return { success: false, error: "管理者権限が必要です" };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "APIキーが設定されていません" };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const levelDesc = LEVEL_DESCRIPTIONS[cefrLevel] ?? "intermediate";
  const accentInstruction = ACCENT_INSTRUCTIONS[accent] ?? ACCENT_INSTRUCTIONS.US;
  const selectedCategory = pickArticleCategory();
  const grammarMode = isGrammarMasterclassCategory(selectedCategory);

  const grammarBlock = grammarMode
    ? `
This run is GRAMMAR MASTERCLASS mode: write the ENTIRE body as a fun, eye-opening English essay that teaches ONE grammar or usage quirk — focus on why natives say it that way, lazy shortcuts, or funny slip-ups learners make. Keep it light and conversational. Explain in English only in the body.`
    : `
This run is culture / trend / daily-life mode: pick a topic that fits the category below — something real, slightly niche, and genuinely fun. Think "wow, natives actually do that?" or "I had no idea that word meant something totally different!"`;

  const hookInstruction = grammarMode
    ? "a funny observation, surprising confession, or playful myth-bust about how natives actually speak (vs. how textbooks claim they do)"
    : "a laugh-out-loud moment, a relatable embarrassment, or a delightful 'wait, really?' cultural fact — never a dry definition or a tourism teaser";

  const prompt = `You are a witty, warm English writer creating short lifestyle-column articles for Japanese learners who want to enjoy English, not stress about it.

Assigned category (follow this — do not choose another): ${selectedCategory}
${grammarBlock}

Target level: ${cefrLevel} — ${levelDesc}
English variant: ${accent} — ${accentInstruction}

STRICTLY FORBIDDEN:
- Tourist-guide fluff ("best cafés", sightseeing lists)
- Generic self-help ("your brain is sabotaging you")
- Bland encyclopedia summaries
- Preachy social commentary or heavy sociology ("unwritten rules of society", "hidden social codes", "office politics", "etiquette violations", "navigating social hierarchies")
- Any topic that feels like homework or a lecture

GREAT topics (aim for these vibes):
- Hilarious everyday misunderstandings between cultures
- Lazy or weird native habits ("we actually say 'gonna' 99% of the time")
- Fun pop-culture quirks, memes, or slang that took on a life of their own
- Surprising things that are totally normal in one country and bizarre in another
- Moments where "correct English" and "real English" are hilariously far apart

REQUIRED: ${accent} English must feel natural — spelling, idioms, and vocabulary consistent with that variant. The dialect controls language, not the setting.

Hard rules:
1. Vocabulary, sentence length, and grammar complexity MUST strictly match ${cefrLevel} level.
2. Apply ${accent} English spelling, vocabulary, and idioms consistently throughout the article.
3. Hook the reader in the very first sentence with ${hookInstruction}.
4. Body length: 200–400 words.
5. Writing style: engaging, humorous, and relatable lifestyle column — ${grammarMode ? "a fun grammar myth-bust or native shortcut that makes readers think 'oh, so THAT'S why!'" : "a delightful cultural or language quirk that makes readers smile and think 'I had no idea!'"}
6. NEVER mention "CEFR", "language learning", "English learner", or the reader's language level.

Output ONLY valid JSON — no markdown fences, no explanation, nothing else:
{"title": "catchy, fun title (max 10 words)", "body": "full article body"}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const raw =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSONが見つかりませんでした");

    const parsed = JSON.parse(match[0]) as { title?: string; body?: string };
    if (!parsed.title || !parsed.body)
      throw new Error("title または body フィールドがありません");

    return { success: true, title: parsed.title.trim(), body: parsed.body.trim() };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "予期しないエラーが発生しました",
    };
  }
}
