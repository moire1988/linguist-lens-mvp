import { ImageResponse } from "next/og";
import { getPublicAnalysis } from "@/lib/db/analyses";

export const runtime = "edge";
export const alt = "LinguistLens 解析結果";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: { id: string };
}) {
  const analysis = await getPublicAnalysis(params.id).catch(() => null);

  const count = analysis?.result.total_count ?? 0;
  const level = analysis?.level ?? "";

  const rawTitle = (() => {
    if (!analysis) return "英語フレーズ解析結果";
    const { title, url } = analysis;
    if (title) return title;
    if (url?.includes("youtube.com") || url?.includes("youtu.be"))
      return "YouTube動画から抽出した英語フレーズ";
    if (url) {
      try {
        return new URL(url).hostname.replace("www.", "");
      } catch {
        return "Web記事から抽出した英語フレーズ";
      }
    }
    return "英語フレーズ解析結果";
  })();

  // 32文字を超えたら truncate
  const displayTitle =
    rawTitle.length > 32 ? rawTitle.slice(0, 31) + "…" : rawTitle;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "64px 72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景グリッド（薄い）*/}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            display: "flex",
          }}
        />

        {/* 右上アクセントサークル */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* ─── ヘッダー：ブランド名 ─── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
            }}
          >
            <span style={{ color: "white", fontSize: 22, lineHeight: 1 }}>
              ✦
            </span>
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1e1b4b",
              letterSpacing: "-0.5px",
            }}
          >
            LinguistLens
          </span>
          {level && (
            <div
              style={{
                display: "flex",
                marginLeft: 16,
                background: "#eef2ff",
                border: "1px solid #c7d2fe",
                borderRadius: 8,
                padding: "4px 14px",
              }}
            >
              <span
                style={{ fontSize: 20, fontWeight: 700, color: "#4338ca" }}
              >
                {level}
              </span>
            </div>
          )}
        </div>

        {/* ─── メインコピー：タイトル ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 14,
              fontWeight: 600,
              color: "#6366f1",
              textTransform: "uppercase",
              letterSpacing: "3px",
            }}
          >
            AI Phrase Extraction
          </div>
          <div
            style={{
              display: "flex",
              fontSize: displayTitle.length > 22 ? 52 : 64,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              maxWidth: 900,
            }}
          >
            {displayTitle}
          </div>
        </div>

        {/* ─── フッター：抽出数バッジ ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "linear-gradient(135deg, #f5f3ff, #eff6ff)",
              border: "1px solid #ddd6fe",
              borderRadius: 16,
              padding: "18px 32px",
            }}
          >
            <span style={{ fontSize: 36 }}>✨</span>
            <span
              style={{ fontSize: 30, fontWeight: 700, color: "#4c1d95" }}
            >
              {count}個の生きた表現を抽出しました
            </span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            linguist-lens-mvp.vercel.app
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
