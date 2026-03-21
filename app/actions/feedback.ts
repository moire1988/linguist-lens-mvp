"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FeedbackInput {
  category: string;
  rating: number;
  comment: string;
}

export type FeedbackResult =
  | { success: true }
  | { success: false; error: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  feature: "機能の要望",
  bug:     "バグ報告",
  cheer:   "応援メッセージ",
  other:   "その他",
};

const EMBED_COLORS: Record<string, number> = {
  feature: 0x6366f1, // indigo
  bug:     0xef4444, // red
  cheer:   0x22c55e, // green
  other:   0x94a3b8, // slate
};

// ─── Server Action ───────────────────────────────────────────────────────────

export async function submitFeedback(
  input: FeedbackInput
): Promise<FeedbackResult> {
  // ── Auth guard
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { success: false, error: "Webhook not configured" };

  // ── Fetch user email (best-effort)
  const user = await currentUser();
  const email =
    user?.emailAddresses?.[0]?.emailAddress ?? "不明";

  const categoryLabel = CATEGORY_LABELS[input.category] ?? input.category;
  const stars = input.rating > 0 ? "⭐".repeat(input.rating) : "未評価";

  // ── Discord Embed payload
  const payload = {
    embeds: [
      {
        title: "💌 フィードバック受信",
        color: EMBED_COLORS[input.category] ?? 0x6366f1,
        fields: [
          { name: "カテゴリー", value: categoryLabel,          inline: true },
          { name: "評価",       value: stars,                   inline: true },
          // zero-width spacer to fill 3rd column
          { name: "\u200b",    value: "\u200b",                inline: true },
          {
            name:   "送信者",
            value:  `${email}\n\`${userId}\``,
            inline: false,
          },
          {
            name:   "コメント",
            value:  input.comment.slice(0, 1024),
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "LinguistLens Feedback" },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Discord returned ${res.status}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "送信に失敗しました",
    };
  }
}
