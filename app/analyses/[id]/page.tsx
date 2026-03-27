import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Youtube } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import {
  getAnalysisDetailResult,
  getAnalysisMetadataAction,
  maybeRedirectUnauthenticatedAnalysisAccess,
} from "@/app/actions/save-analysis";
import { AnalysisDevErrorPanel } from "@/components/analysis-dev-error";
import { normalizeAnalysisId } from "@/lib/analysis-id";
import { AnalysisDetailBody } from "@/components/analysis-detail-body";
import { AnalysisDetailFooter } from "@/components/analysis-detail-footer";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import { AdBanner } from "@/components/ad-banner";
import { fetchYoutubeOembedTitle } from "@/lib/youtube-oembed";
import { extractYouTubeVideoId } from "@/lib/youtube-url";
import { fetchPageTitle } from "@/lib/fetch-page-title";
import { resolveTranscriptPlainText } from "@/lib/analysis-transcript";
import { cn } from "@/lib/utils";
import { CEFR_CONTENT_META } from "@/lib/cefr-content-meta";
import { FavoriteFakeDoorButton } from "@/components/favorite-fake-door-button";
import { AnalysisCoachCallout } from "@/components/analysis-coach-callout";
import { getPublicSiteUrl } from "@/lib/site-url";

function fallbackLabelFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") || "Web";
  } catch {
    return "Web";
  }
}

/** ヒーロー用: youtube.com / youtu.be 上のページか（URL 解析は Globe に統一するため source_type だけに依存しない） */
function isLikelyYoutubeHostname(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return (
      h === "youtu.be" ||
      h.endsWith("youtube.com") ||
      h.endsWith("youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

const CEFR_RANK: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

function buildMetaDescription(
  level: string,
  totalCount: number,
  url: string | null
): string {
  const source = url?.includes("youtube")
    ? "YouTube動画"
    : url
      ? "Web記事"
      : "テキスト";
  return `AIが${source}から抽出した${level}レベルの重要英語表現${totalCount}個を日本語で解説。句動詞・イディオム・コロケーションを厳選。`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = normalizeAnalysisId(resolvedParams.id);
  const meta = await getAnalysisMetadataAction(id);

  if (!meta) {
    return {
      title: "解析結果 | LinguistLens",
      description:
        "LinguistLensで英語コンテンツを解析し、本当に使える表現を学びましょう。",
    };
  }

  const { phraseCount, cefrLevel, sourceUrl, contentTitle, resultTitle } = meta;
  const titleFromData = contentTitle || resultTitle;
  const pageTitle = (() => {
    if (titleFromData) return `「${titleFromData}」の英語フレーズ ${phraseCount}選`;
    if (sourceUrl?.includes("youtube.com") || sourceUrl?.includes("youtu.be")) {
      return `YouTube動画から学ぶ英語フレーズ（${cefrLevel}）${phraseCount}選`;
    }
    if (sourceUrl) {
      try {
        const domain = new URL(sourceUrl).hostname.replace("www.", "");
        return `${domain} から学ぶ英語フレーズ（${cefrLevel}）${phraseCount}選`;
      } catch {
        return `Web記事から学ぶ英語フレーズ（${cefrLevel}）${phraseCount}選`;
      }
    }
    return `${cefrLevel}レベルの英語フレーズ ${phraseCount}選`;
  })();

  const description = buildMetaDescription(cefrLevel, phraseCount, sourceUrl);

  const siteOrigin = getPublicSiteUrl();
  const ogUrl = `${siteOrigin}/analyses/${id}`;
  const ogImage = `${siteOrigin}/analyses/${id}/opengraph-image`;

  return {
    title: `${pageTitle} | LinguistLens`,
    description,
    openGraph: {
      type: "article",
      url: ogUrl,
      title: `${pageTitle} | LinguistLens`,
      description,
      siteName: "LinguistLens",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageTitle} | LinguistLens`,
      description,
      images: [ogImage],
    },
    alternates: { canonical: ogUrl },
  };
}

export default async function AnalysisDetailPage({ params }: Props) {
  const { userId } = await auth();
  const resolvedParams = await params;
  const id = normalizeAnalysisId(resolvedParams.id);

  const result = await getAnalysisDetailResult(id);

  if (!result.ok) {
    if (process.env.NODE_ENV === "development") {
      return <AnalysisDevErrorPanel id={id} failure={result.failure} />;
    }
    await maybeRedirectUnauthenticatedAnalysisAccess(result, id);
    notFound();
  }

  const analysis = result.analysis;

  if (!analysis?.data) {
    notFound();
  }

  const {
    sourceUrl,
    cefrLevel,
    savedAt,
    data,
    isPublic,
    isApproved,
    isOwner,
    publicReviewRequested,
  } = analysis;

  const phrasesList = Array.isArray(data.phrases) ? data.phrases : [];
  const totalCount =
    typeof data.total_count === "number" && Number.isFinite(data.total_count)
      ? data.total_count
      : phrasesList.length;

  const showPaywall = !userId;

  const isTextSource = data.source_type === "text";
  const ytVideoId = sourceUrl ? extractYouTubeVideoId(sourceUrl) : null;
  /** 実際の YouTube 動画 URL のみ。Web 解析ページの見た目を変えないため source_type と動画 ID の両方で判定 */
  const isYoutubeVideoPage =
    data.source_type === "youtube" && ytVideoId !== null;

  const shareUrl = `${getPublicSiteUrl()}/analyses/${id}`;

  /** ヒーロー（動画・Web）。テキスト解析は別レイアウトのため未使用。 */
  let headingTitle: string | null = null;
  if (!isTextSource) {
    headingTitle =
      (typeof data.title === "string" && data.title.trim() !== ""
        ? data.title.trim()
        : null) ??
      (analysis.contentTitle?.trim() || null);

    if (sourceUrl) {
      const urlIsYoutubeHost = isLikelyYoutubeHostname(sourceUrl);
      if (!headingTitle && urlIsYoutubeHost) {
        headingTitle = await fetchYoutubeOembedTitle(sourceUrl);
      }
      if (!headingTitle && !urlIsYoutubeHost) {
        headingTitle = await fetchPageTitle(sourceUrl);
      }
      if (!headingTitle) {
        headingTitle = urlIsYoutubeHost
          ? "YouTube 動画"
          : fallbackLabelFromUrl(sourceUrl);
      }
    }
    if (!headingTitle) {
      headingTitle = "貼り付けテキスト";
    }
  }

  const transcriptPlain = resolveTranscriptPlainText(data);

  const overallLevel = data.overall_level;
  let levelGap: number | null = null;
  if (
    overallLevel &&
    cefrLevel &&
    CEFR_RANK[overallLevel] !== undefined &&
    CEFR_RANK[cefrLevel] !== undefined
  ) {
    levelGap = CEFR_RANK[overallLevel] - CEFR_RANK[cefrLevel];
  }

  const contentLevelMeta = overallLevel
    ? CEFR_CONTENT_META[overallLevel]
    : undefined;

  return (
    <div className="min-h-screen relative">
      <SiteHeader maxWidth="5xl" right={<GlobalNav showVocabularyLink />} />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Video / article hero — 戻るリンクと日付を同一行・白枠の外 */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              別の動画を解析する
            </Link>
            <time
              dateTime={savedAt}
              className="shrink-0 text-xs tabular-nums text-slate-400"
            >
              {new Date(savedAt).toLocaleDateString("ja-JP")}
            </time>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className={cn(
                "flex min-w-0 flex-1",
                !isTextSource &&
                  (ytVideoId ||
                    (sourceUrl &&
                      data.source_type === "youtube" &&
                      isLikelyYoutubeHostname(sourceUrl))) &&
                  "items-center gap-3"
              )}
            >
              {!isTextSource && (
                <>
                  {ytVideoId ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`}
                      alt={headingTitle ?? ""}
                      className="w-[120px] h-[68px] object-cover rounded-xl flex-shrink-0 shadow-sm border border-slate-200"
                    />
                  ) : sourceUrl &&
                    data.source_type === "youtube" &&
                    isLikelyYoutubeHostname(sourceUrl) ? (
                    <div className="w-[120px] h-[68px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Youtube className="h-8 w-8 text-red-400" />
                    </div>
                  ) : null}
                </>
              )}
              <div className="min-w-0">
                {isTextSource ? (
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    {cefrLevel}レベルの英語表現 {totalCount}選
                  </h1>
                ) : (
                  <>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight tracking-tight">
                      {headingTitle}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5 sm:mt-1">
                      {cefrLevel}レベルの英語表現 {totalCount}選
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {data.overall_level && (
                <span
                  className={cn(
                    "inline-flex items-baseline gap-1 px-3 py-1.5 rounded-full border shadow-sm",
                    contentLevelMeta?.bg ?? "bg-indigo-50",
                    contentLevelMeta?.text ?? "text-indigo-700",
                    contentLevelMeta?.border ?? "border-indigo-100"
                  )}
                >
                  <span className="text-[10px] font-normal leading-none">
                    コンテンツレベル
                  </span>
                  <span className="text-xs font-extrabold">
                    {data.overall_level}
                  </span>
                  {contentLevelMeta?.label != null && (
                    <span className="text-xs font-medium opacity-80">
                      {contentLevelMeta.label}
                    </span>
                  )}
                </span>
              )}
              <FavoriteFakeDoorButton />
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors",
                    isYoutubeVideoPage
                      ? "text-slate-500 hover:text-red-500"
                      : "text-slate-500 hover:text-sky-600"
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {isYoutubeVideoPage ? "YouTube" : "ページリンク"}
                  </span>
                </a>
              ) : null}
            </div>
          </div>

          {levelGap !== null && (
            <div className="mt-4">
              {levelGap >= 2 && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span className="text-base mt-0.5">💡</span>
                  <p className="text-sm text-amber-800">
                    このコンテンツは抽出対象（{cefrLevel}）より
                    <span className="font-bold">{levelGap}段階</span>
                    難易度が高いです。難しく感じても大丈夫。まずフレーズを一つずつ押さえましょう。
                  </p>
                </div>
              )}
              {levelGap === 0 && (
                <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                  <span className="text-base mt-0.5">✨</span>
                  <p className="text-sm text-indigo-800">
                    ちょうど背伸びできる難易度のコンテンツです。理想的な学習素材！
                  </p>
                </div>
              )}
              {levelGap < 0 && (
                <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                  <span className="text-base mt-0.5">📘</span>
                  <p className="text-sm text-sky-800">
                    やさしめのコンテンツです。表現のニュアンスや使い分けを深掘りしてみましょう。
                  </p>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        <AdBanner className="mb-8" />

        <AnalysisDetailBody
          sourceUrl={sourceUrl ?? ""}
          phrases={phrasesList}
          sourceText={transcriptPlain}
          highlightedHtml={data.full_script_with_highlight}
          showPaywall={showPaywall}
          totalCount={totalCount}
          sourceAnalysisId={id}
          coachSlot={
            typeof data.coach_comment === "string" &&
            data.coach_comment.trim() !== "" ? (
              <AnalysisCoachCallout text={data.coach_comment} />
            ) : null
          }
        />

        <AnalysisDetailFooter
          analysisId={id}
          isOwner={isOwner}
          initialIsPublic={isPublic}
          initialPublicReviewRequested={publicReviewRequested}
          initialIsApproved={isApproved ?? false}
          showYoutubeListingPanel={isYoutubeVideoPage}
          shareUrl={shareUrl}
          phraseCount={totalCount}
          cefrLevel={cefrLevel}
        />
      </main>
    </div>
  );
}
