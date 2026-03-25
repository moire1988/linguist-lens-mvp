import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Youtube, Globe, FileText } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { getPublicAnalysis } from "@/lib/db/analyses";
import type { PhraseResult } from "@/lib/types";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import { AnalysisDetailBody } from "@/components/analysis-detail-body";
import { fetchYoutubeOembedTitle } from "@/lib/youtube-oembed";
import { normalizeAnalysisId } from "@/lib/analysis-id";

const SITE_URL = "https://linguist-lens-mvp.vercel.app";

function fallbackLabelFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") || "Web";
  } catch {
    return "Web";
  }
}

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600",
  A2: "bg-green-100 text-green-700",
  B1: "bg-blue-100 text-blue-700",
  B2: "bg-indigo-100 text-indigo-700",
  C1: "bg-purple-100 text-purple-700",
  C2: "bg-rose-100 text-rose-700",
};

function buildTitle(
  title: string | null,
  url: string | null,
  level: string,
  totalCount: number
): string {
  if (title) return `「${title}」の英語フレーズ ${totalCount}選`;
  if (url?.includes("youtube.com") || url?.includes("youtu.be"))
    return `YouTube動画から学ぶ英語フレーズ（${level}）${totalCount}選`;
  if (url) {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return `${domain} から学ぶ英語フレーズ（${level}）${totalCount}選`;
    } catch {
      return `Web記事から学ぶ英語フレーズ（${level}）${totalCount}選`;
    }
  }
  return `${level}レベルの英語フレーズ ${totalCount}選`;
}

function buildDescription(
  phrases: PhraseResult[],
  level: string,
  totalCount: number,
  url: string | null
): string {
  const source = url?.includes("youtube") ? "YouTube動画" : url ? "Web記事" : "テキスト";
  const top3 = phrases
    .slice(0, 3)
    .map((p) => `${p.expression}（${p.meaning_ja}）`)
    .join("、");
  return `AIが${source}から抽出した${level}レベルの重要英語表現${totalCount}個を日本語で解説。${top3}など、日本人が使えるようになりたい句動詞・イディオムを厳選。`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const id = normalizeAnalysisId(resolved.id);
  const analysis = id ? await getPublicAnalysis(id) : null;
  if (!analysis) return { title: "ページが見つかりません" };

  const pageTitle = buildTitle(
    analysis.title,
    analysis.url,
    analysis.level,
    analysis.result.total_count
  );
  const description = buildDescription(
    analysis.result.phrases,
    analysis.level,
    analysis.result.total_count,
    analysis.url
  );
  const canonicalUrl = `${SITE_URL}/share/${id}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: `${pageTitle} | LinguistLens`,
      description,
      images: [
        {
          url: `${SITE_URL}/share/${id}/opengraph-image`,
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
      images: [`${SITE_URL}/share/${id}/opengraph-image`],
    },
    alternates: { canonical: canonicalUrl },
  };
}

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  const id = normalizeAnalysisId(resolved.id);
  const analysis = id ? await getPublicAnalysis(id) : null;
  if (!analysis) notFound();

  const { userId } = await auth();
  const showPaywall = !userId;

  const { title, url, level, result, createdAt } = analysis;
  const phrasesList = Array.isArray(result.phrases) ? result.phrases : [];
  const totalCount =
    typeof result.total_count === "number" && Number.isFinite(result.total_count)
      ? result.total_count
      : phrasesList.length;

  const isYoutube = result.source_type === "youtube";
  const ytId =
    url?.match(/[?&]v=([^&]{11})/)?.[1] ??
    url?.match(/youtu\.be\/([^?&]{11})/)?.[1];

  let headingTitle: string | null =
    (typeof result.title === "string" && result.title.trim() !== ""
      ? result.title.trim()
      : null) ?? (title?.trim() || null);

  if (!headingTitle && url && isYoutube) {
    headingTitle = await fetchYoutubeOembedTitle(url);
  }
  if (!headingTitle && url) {
    headingTitle = isYoutube ? "YouTube 動画" : fallbackLabelFromUrl(url);
  }
  if (!headingTitle) {
    headingTitle = "貼り付けテキスト";
  }

  const sourceTextForScript = result.source_text ?? "";

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
              ) : url ? (
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
                  {level}レベルの英語表現 {totalCount}選
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              <span
                className={`text-xs font-extrabold px-3 py-1.5 rounded-full border border-slate-200 ${
                  CEFR_COLORS[level] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                対象 {level}
              </span>
              {result.overall_level && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  全体 {result.overall_level}
                </span>
              )}
              <span className="text-xs text-slate-400">
                {new Date(createdAt).toLocaleDateString("ja-JP")}
              </span>
              {url ? (
                <a
                  href={url}
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
          {result.overall_level && (
            <>
              <div className="w-px h-8 bg-indigo-200" />
              <div className="text-center">
                <p className="text-2xl font-extrabold text-indigo-600">
                  {result.overall_level}
                </p>
                <p className="text-[10px] text-indigo-400 font-medium">
                  コンテンツレベル
                </p>
              </div>
            </>
          )}
          <div className="w-px h-8 bg-indigo-200" />
          <div className="text-sm text-indigo-700 font-medium flex-1">
            {level}レベルに合わせて抽出した重要フレーズ集
          </div>
        </div>

        <AnalysisDetailBody
          sourceUrl={url ?? ""}
          phrases={phrasesList}
          sourceText={sourceTextForScript}
          highlightedHtml={result.full_script_with_highlight}
          showPaywall={showPaywall}
          totalCount={totalCount}
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
