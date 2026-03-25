"use server";

import { Client } from "@notionhq/client";
import type { PhraseResult } from "@/lib/types";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SaveToNotionParams {
  phrase: PhraseResult;
  sourceUrl?: string;  // 元のYouTube/Web記事URL
}

export interface SaveAllToNotionParams {
  phrases: PhraseResult[];
  sourceUrl?: string;
  cefrLevel: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  phrasal_verb: "句動詞",
  idiom: "イディオム",
  collocation: "コロケーション",
  grammar_pattern: "文法パターン",
};

function getClient() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error("NOTION_API_KEY が設定されていません");
  return new Client({ auth: apiKey });
}

function getDatabaseId() {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) throw new Error("NOTION_DATABASE_ID が設定されていません");
  return id;
}

// ─── Save single phrase ────────────────────────────────────────────────────

export async function savePhrasToNotion(
  params: SaveToNotionParams
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const notion = getClient();
    const databaseId = getDatabaseId();
    const { phrase, sourceUrl } = params;

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        // タイトル（表現名）
        Name: {
          title: [{ text: { content: phrase.expression } }],
        },
        // 種類
        種類: {
          select: { name: TYPE_LABELS[phrase.type] ?? phrase.type },
        },
        // CEFRレベル
        "CEFRレベル": {
          select: { name: phrase.cefr_level },
        },
        // 日本語訳
        意味: {
          rich_text: [{ text: { content: phrase.meaning_ja } }],
        },
        // ニュアンス解説
        ニュアンス: {
          rich_text: [{ text: { content: phrase.nuance } }],
        },
        // 例文
        例文: {
          rich_text: [{ text: { content: phrase.example } }],
        },
        // 元テキストの文脈
        文脈: {
          rich_text: [{ text: { content: phrase.context } }],
        },
        // 日本人が苦手な理由
        学習ポイント: {
          rich_text: [{ text: { content: phrase.why_hard_for_japanese } }],
        },
        // 元コンテンツURL（YouTubeなど）
        ...(sourceUrl
          ? {
              ソースURL: {
                url: sourceUrl,
              },
            }
          : {}),
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Notionへの保存に失敗しました",
    };
  }
}

// ─── Save all phrases ──────────────────────────────────────────────────────

export async function saveAllPhrasesToNotion(
  params: SaveAllToNotionParams
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const { phrases, sourceUrl } = params;

    // 並列保存（最大5件ずつ）
    const results = [];
    for (let i = 0; i < phrases.length; i += 5) {
      const batch = phrases.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map((phrase) => savePhrasToNotion({ phrase, sourceUrl }))
      );
      results.push(...batchResults);
    }

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return {
        success: false,
        error: `${failed.length}件の保存に失敗しました。Notion設定を確認してください。`,
      };
    }

    return { success: true, count: results.length };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Notionへの一括保存に失敗しました",
    };
  }
}
