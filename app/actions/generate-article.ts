"use server";

import Anthropic from "@anthropic-ai/sdk";

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

// ─── Server Action ───────────────────────────────────────────────────────────

export async function generateArticle(
  cefrLevel: string
): Promise<GenerateArticleResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "APIキーが設定されていません" };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const levelDesc = LEVEL_DESCRIPTIONS[cefrLevel] ?? "intermediate";

  const prompt = `You are a creative English writer producing short magazine-style articles for language learners.

Target level: ${cefrLevel} — ${levelDesc}

Task: Write ONE engaging, educational English article on a topic of your choosing.

Topic must come from one of these categories (pick whichever inspires you):
- Surprising historical facts that changed the world
- Unusual cultural traditions from around the globe
- How a piece of everyday technology actually works
- Counterintuitive psychology or behaviour science
- Fascinating animal or nature discoveries
- Mind-bending geography or space facts
- Common health myths debunked by science
- Quirky economic phenomena that affect daily life
- Unexpected language or linguistics trivia

Hard rules:
1. Vocabulary, sentence length, and grammar complexity MUST strictly match ${cefrLevel} level.
2. Hook the reader in the very first sentence with a surprising fact or question.
3. Body length: 200–400 words.
4. Writing style: engaging short magazine article — facts that make people say "I had no idea!"
5. NEVER mention "CEFR", "language learning", "English learner", or the reader's language level.

Output ONLY valid JSON — no markdown fences, no explanation, nothing else:
{"title": "catchy title (max 10 words)", "body": "full article body"}`;

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
