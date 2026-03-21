"use server";

import Anthropic from "@anthropic-ai/sdk";

export async function translateTranscript(
  text: string
): Promise<{ success: boolean; translation?: string; error?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "API キーが設定されていません" };
  }

  const truncated = text.slice(0, 6000);

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `以下の英語テキストを自然な日本語に翻訳してください。翻訳のみを出力し、説明や前置きは不要です。\n\n${truncated}`,
        },
      ],
    });
    const translation =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return { success: true, translation };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "翻訳に失敗しました",
    };
  }
}
