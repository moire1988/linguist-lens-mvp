import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase-admin";
import { normalizeAnalysisId } from "@/lib/analysis-id";
import { extractYouTubeVideoId } from "@/lib/youtube-url";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";

export const alt = "LinguistLens 解析結果";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const revalidate = 600;

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const NOTO_JP_WOFF =
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.18/files/noto-sans-jp-japanese-700-normal.woff";

/** `HeaderLogo`（`site-header.tsx`）と同じ Google Goldman 400 */
const GOLDMAN_WOFF =
  "https://cdn.jsdelivr.net/npm/@fontsource/goldman@5.2.8/files/goldman-latin-400-normal.woff";

/** ヘッダーの「LinguistLens」文字色（`HeaderLogo` の inline style と一致） */
const BRAND_WORDMARK_COLOR = "#1A2D42";

interface AnalysisOgRow {
  title: string | null;
  url: string | null;
  level: string;
  video_id: string | null;
  result_json: AnalysisResult | null;
}

function resolvePhraseCount(row: AnalysisOgRow): number {
  const raw = row.result_json;
  if (!raw) return 0;
  const phrases = Array.isArray(raw.phrases) ? raw.phrases : [];
  const len = phrases.length;
  const tc = raw.total_count as unknown;
  let nFromTotal: number | null = null;
  if (typeof tc === "number" && Number.isFinite(tc) && tc >= 0) {
    nFromTotal = Math.floor(tc);
  } else if (typeof tc === "string" && tc.trim() !== "") {
    const p = parseInt(tc.trim(), 10);
    if (!Number.isNaN(p) && p >= 0) nFromTotal = p;
  }
  if (nFromTotal !== null) return Math.max(nFromTotal, len);
  return len;
}

function displayTitleFromRow(row: AnalysisOgRow | null): string {
  if (!row) return "LinguistLens";
  const fromRow = row.title?.trim();
  if (fromRow) return fromRow;
  const fromJson =
    typeof row.result_json?.title === "string" ? row.result_json.title.trim() : "";
  if (fromJson) return fromJson;
  const { url } = row;
  if (url?.includes("youtube.com") || url?.includes("youtu.be")) {
    return "YouTube動画から抽出した英語フレーズ";
  }
  if (url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "Web記事から抽出した英語フレーズ";
    }
  }
  return "テキストから抽出した英語フレーズ";
}

function truncateTitle(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(0, maxChars - 1))}…`;
}

function resolveYoutubeId(row: AnalysisOgRow): string | null {
  const fromCol = row.video_id?.trim();
  if (fromCol && /^[a-zA-Z0-9_-]{11}$/.test(fromCol)) return fromCol;
  const u = row.url;
  if (u) {
    const id = extractYouTubeVideoId(u);
    if (id) return id;
  }
  return null;
}

/** `node:buffer` の静的 import を避け（dev での欠落チャンクを減らす）、Node は Buffer グローバルで base64 化。 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const Buf = globalThis.Buffer;
  if (typeof Buf !== "undefined") {
    return Buf.from(buffer).toString("base64");
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function fetchYoutubeThumbnailDataUrl(videoId: string): Promise<string | null> {
  const variants = ["maxresdefault", "hqdefault", "mqdefault"] as const;
  for (const v of variants) {
    const imageUrl = `https://img.youtube.com/vi/${videoId}/${v}.jpg`;
    try {
      const res = await fetch(imageUrl, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const contentTypeHeader = res.headers.get("content-type") ?? "";
      if (!contentTypeHeader.startsWith("image/")) continue;
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 2500) continue;
      const mime = contentTypeHeader.includes("png") ? "image/png" : "image/jpeg";
      const b64 = arrayBufferToBase64(buf);
      return `data:${mime};base64,${b64}`;
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchAnalysisRow(id: string): Promise<AnalysisOgRow | null> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("saved_analyses")
      .select("title,url,level,result_json,video_id")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as AnalysisOgRow;
  } catch {
    return null;
  }
}

type OgFont = { name: string; data: ArrayBuffer; weight: number; style: "normal" };

async function loadOgFonts(): Promise<{
  fonts: OgFont[];
  fontFamilyJa: string;
  fontFamilyBrand: string;
}> {
  const empty = {
    fonts: [] as OgFont[],
    fontFamilyJa: "system-ui, sans-serif",
    fontFamilyBrand: "system-ui, sans-serif",
  };
  try {
    const [notoRes, goldRes] = await Promise.all([
      fetch(NOTO_JP_WOFF, { next: { revalidate: 86400 } }),
      fetch(GOLDMAN_WOFF, { next: { revalidate: 86400 } }),
    ]);
    const fonts: OgFont[] = [];
    let fontFamilyJa = empty.fontFamilyJa;
    let fontFamilyBrand = empty.fontFamilyBrand;
    if (notoRes.ok) {
      fonts.push({
        name: "Noto Sans JP",
        data: await notoRes.arrayBuffer(),
        weight: 700,
        style: "normal",
      });
      fontFamilyJa = "Noto Sans JP";
    }
    if (goldRes.ok) {
      fonts.push({
        name: "Goldman",
        data: await goldRes.arrayBuffer(),
        weight: 400,
        style: "normal",
      });
      fontFamilyBrand = "Goldman";
    }
    return { fonts, fontFamilyJa, fontFamilyBrand };
  } catch {
    return empty;
  }
}

/**
 * `components/linguist-lens-logo.tsx` と同じマーク（ホバーアニメなし）。
 */
function OgBrandIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "flex", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="ogll-g1" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="ogll-g2" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <clipPath id="ogll-circ">
          <circle cx="50" cy="50" r="50" />
        </clipPath>
        <clipPath id="ogll-upper">
          <polygon points="0,0 100,0 0,100" />
        </clipPath>
        <clipPath id="ogll-lower">
          <polygon points="100,0 100,100 0,100" />
        </clipPath>
      </defs>
      <g clipPath="url(#ogll-circ)">
        <rect
          width="100"
          height="100"
          fill="url(#ogll-g1)"
          clipPath="url(#ogll-upper)"
        />
        <rect
          width="100"
          height="100"
          fill="url(#ogll-g2)"
          clipPath="url(#ogll-lower)"
        />
      </g>
    </svg>
  );
}

export default async function OgImage({
  params,
}: {
  params: { id: string };
}) {
  const id = normalizeAnalysisId(params.id ?? "");
  const [row, { fonts, fontFamilyJa, fontFamilyBrand }] = await Promise.all([
    fetchAnalysisRow(id),
    loadOgFonts(),
  ]);

  const phraseCount = row ? resolvePhraseCount(row) : 0;
  const level = row?.level?.trim() ?? "";
  const rawTitle = displayTitleFromRow(row);
  const title = truncateTitle(rawTitle, 68);
  const ytId = row ? resolveYoutubeId(row) : null;
  const thumbDataUrl = ytId ? await fetchYoutubeThumbnailDataUrl(ytId) : null;

  if (!row) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#fafafa",
            position: "relative",
            overflow: "hidden",
            fontFamily: fontFamilyJa,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(165deg, rgba(255,255,255,0) 40%, rgba(139,92,246,0.18) 72%, rgba(124,58,237,0.35) 100%)",
              display: "flex",
            }}
          />
          <div style={{ display: "flex", marginBottom: 24 }}>
            <OgBrandIcon size={96} />
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 400,
              fontFamily: fontFamilyBrand,
              color: BRAND_WORDMARK_COLOR,
              letterSpacing: "-0.5px",
            }}
          >
            LinguistLens
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 26,
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            AI 英語フレーズ解析
          </div>
        </div>
      ),
      { width: OG_WIDTH, height: OG_HEIGHT, fonts }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f8fafc",
          position: "relative",
          overflow: "hidden",
          fontFamily: fontFamilyJa,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 220,
            background:
              "linear-gradient(180deg, rgba(248,250,252,0) 0%, rgba(196,181,253,0.35) 55%, rgba(124,58,237,0.55) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "row",
            flex: 1,
            padding: "48px 56px 40px",
            gap: 44,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 520,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {thumbDataUrl ? (
              <div
                style={{
                  display: "flex",
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
                  border: "1px solid rgba(148,163,184,0.35)",
                }}
              >
                <img
                  src={thumbDataUrl}
                  alt=""
                  width={520}
                  height={292}
                  style={{
                    display: "flex",
                    objectFit: "cover",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 520,
                  height: 292,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(145deg, #ede9fe 0%, #e0e7ff 45%, #f5f3ff 100%)",
                  border: "1px solid rgba(167,139,250,0.45)",
                  boxShadow: "0 16px 40px rgba(99,102,241,0.12)",
                }}
              >
                <span style={{ fontSize: 72, opacity: 0.35 }}>▶</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              gap: 22,
              minWidth: 0,
              paddingRight: 8,
            }}
          >
            {level ? (
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  background: "linear-gradient(135deg, #7c3aed, #6366f1)",
                  borderRadius: 999,
                  padding: "10px 22px",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "0.02em",
                  }}
                >
                  {level}レベルの重要フレーズ
                </span>
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                fontSize: title.length > 48 ? 40 : 46,
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.22,
                letterSpacing: "-0.5px",
              }}
            >
              {title}
            </div>

            {phraseCount > 0 ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#475569",
                }}
              >
                {phraseCount} 件の表現を抽出
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            zIndex: 2,
            right: 48,
            bottom: 36,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <OgBrandIcon size={36} />
          <span
            style={{
              fontSize: 26,
              fontWeight: 400,
              fontFamily: fontFamilyBrand,
              color: BRAND_WORDMARK_COLOR,
              letterSpacing: "-0.2px",
            }}
          >
            LinguistLens
          </span>
        </div>
      </div>
    ),
    { width: OG_WIDTH, height: OG_HEIGHT, fonts }
  );
}
