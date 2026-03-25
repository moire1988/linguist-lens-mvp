import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Youtube, Globe, FileText } from "lucide-react";
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
import { resolveTranscriptPlainText } from "@/lib/analysis-transcript";

function fallbackLabelFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") || "Web";
  } catch {
    return "Web";
  }
}

const SITE_URL = "https://linguist-lens-mvp.vercel.app";

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

  const ogUrl = `${SITE_URL}/analyses/${id}`;
  const ogImage = `${SITE_URL}/analyses/${id}/opengraph-image`;

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

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600",
  A2: "bg-green-100 text-green-700",
  B1: "bg-blue-100 text-blue-700",
  B2: "bg-indigo-100 text-indigo-700",
  C1: "bg-purple-100 text-purple-700",
  C2: "bg-rose-100 text-rose-700",
};

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
    isOwner,
    publicReviewRequested,
  } = analysis;

  const phrasesList = Array.isArray(data.phrases) ? data.phrases : [];
  const totalCount =
    typeof data.total_count === "number" && Number.isFinite(data.total_count)
      ? data.total_count
      : phrasesList.length;

  const showPaywall = !userId;

  const isYoutube = data.source_type === "youtube";
  const ytId =
    sourceUrl?.match(/[?&]v=([^&]{11})/)?.[1] ??
    sourceUrl?.match(/youtu\.be\/([^?&]{11})/)?.[1];

  const shareUrl = `${SITE_URL}/analyses/${id}`;

  let headingTitle: string | null =
    (typeof data.title === "string" && data.title.trim() !== ""
      ? data.title.trim()
      : null) ??
    (analysis.contentTitle?.trim() || null);

  if (!headingTitle && sourceUrl && isYoutube) {
    headingTitle = await fetchYoutubeOembedTitle(sourceUrl);
  }
  if (!headingTitle && sourceUrl) {
    headingTitle = isYoutube ? "YouTube 動画" : fallbackLabelFromUrl(sourceUrl);
  }
  if (!headingTitle) {
    headingTitle = "貼り付けテキスト";
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

  return (
    <div className="min-h-screen relative">
      <SiteHeader maxWidth="5xl" right={<GlobalNav />} />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          別の動画を解析する
        </Link>

        {/* Video / article hero — examples 風・aspect-video サムネ */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-8">
            <div className="w-full lg:max-w-md xl:max-w-lg shrink-0 mx-auto lg:mx-0">
              {ytId ? (
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt={headingTitle}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : isYoutube ? (
                <div className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                  <Youtube className="h-14 w-14 text-red-400" />
                </div>
              ) : sourceUrl ? (
                <div className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                  <Globe className="h-14 w-14 text-slate-300" />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                  <FileText className="h-14 w-14 text-slate-300" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
                {headingTitle}
              </h1>
              <p className="text-sm text-slate-500 mt-3">
                {cefrLevel}レベルの英語表現 {totalCount}選
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <span
                  className={`text-xs font-extrabold px-3 py-1.5 rounded-full border border-slate-200 ${
                    CEFR_COLORS[cefrLevel] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  対象 {cefrLevel}
                </span>
                {data.overall_level && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    全体 {data.overall_level}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {new Date(savedAt).toLocaleDateString("ja-JP")}
                </span>
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {isYoutube ? "YouTube" : "Web"}
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">テキスト入力</span>
                )}
              </div>
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

        {/* 抽出サマリー */}
        <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3.5 mb-8">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-indigo-600">{totalCount}</p>
            <p className="text-[10px] text-indigo-400 font-medium">抽出表現</p>
          </div>
          {data.overall_level && (
            <>
              <div className="w-px h-8 bg-indigo-200" />
              <div className="text-center">
                <p className="text-2xl font-extrabold text-indigo-600">
                  {data.overall_level}
                </p>
                <p className="text-[10px] text-indigo-400 font-medium">
                  コンテンツレベル
                </p>
              </div>
            </>
          )}
          <div className="w-px h-8 bg-indigo-200" />
          <div className="text-sm text-indigo-700 font-medium flex-1">
            {cefrLevel}レベルに合わせて抽出した重要フレーズ集
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
        />

        <AnalysisDetailFooter
          analysisId={id}
          isOwner={isOwner}
          initialIsPublic={isPublic}
          initialPublicReviewRequested={publicReviewRequested}
          shareUrl={shareUrl}
          phraseCount={totalCount}
          cefrLevel={cefrLevel}
        />
      </main>
    </div>
  );
}
