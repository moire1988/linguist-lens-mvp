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
import { AnalysisSharePanel } from "@/components/analysis-share-panel";
import { AnalysisDetailBody } from "@/components/analysis-detail-body";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import { fetchYoutubeOembedTitle } from "@/lib/youtube-oembed";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = normalizeAnalysisId(resolvedParams.id);
  const meta = await getAnalysisMetadataAction(id);

  const title = meta
    ? `${meta.cefrLevel}レベルの英語表現 ${meta.phraseCount}選 | LinguistLens`
    : "解析結果 | LinguistLens";

  const description = meta
    ? `英語コンテンツから抽出した${meta.phraseCount}個の重要フレーズ（${meta.cefrLevel}レベル）。句動詞・イディオム・コロケーションをニュアンス解説付きで学べます。`
    : "LinguistLensで英語コンテンツを解析し、本当に使える表現を学びましょう。";

  const ogImage = `${SITE_URL}/og`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/analyses/${id}`,
      siteName: "LinguistLens",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "LinguistLens" }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
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

  const { sourceUrl, cefrLevel, savedAt, data, isPublic, isOwner } = analysis;

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

  const sourceTextForScript = data.source_text ?? "";

  return (
    <div className="min-h-screen relative">
      <SiteHeader maxWidth="5xl" right={<GlobalNav />} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          別の動画を解析する
        </Link>

        {/* Video / source info — examples ページと同じ構造（タイトル＋サブラベル、リンクは右端1つ） */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {ytId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                  alt={headingTitle}
                  className="w-[120px] h-[68px] object-cover rounded-xl flex-shrink-0 shadow-sm"
                />
              ) : isYoutube ? (
                <div className="w-[120px] h-[68px] rounded-xl flex-shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                  <Youtube className="h-8 w-8 text-red-400" />
                </div>
              ) : sourceUrl ? (
                <div className="w-[120px] h-[68px] rounded-xl flex-shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                  <Globe className="h-8 w-8 text-slate-300" />
                </div>
              ) : (
                <div className="w-[120px] h-[68px] rounded-xl flex-shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight truncate">
                  {headingTitle}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {cefrLevel}レベルの英語表現 {totalCount}選
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
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
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
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

        <AnalysisDetailBody
          sourceUrl={sourceUrl ?? ""}
          phrases={phrasesList}
          sourceText={sourceTextForScript}
          highlightedHtml={data.full_script_with_highlight}
          showPaywall={showPaywall}
          totalCount={totalCount}
        />

        <AnalysisSharePanel
          analysisId={id}
          initialIsPublic={isPublic}
          isOwner={isOwner}
          shareUrl={shareUrl}
          phraseCount={totalCount}
          cefrLevel={cefrLevel}
        />

        {!showPaywall && (
          <div className="flex justify-center gap-3 mt-10 mb-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              別の動画を解析する
            </Link>
            <Link
              href="/mypage"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              マイ単語帳を見る
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
