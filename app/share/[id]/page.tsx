import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Youtube, Globe, FileText } from "lucide-react";
import { getPublicAnalysis } from "@/lib/db/analyses";
import type { PhraseResult } from "@/lib/types";
import { AdBanner } from "@/components/ad-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const SITE_URL = "https://linguist-lens-mvp.vercel.app";

const TYPE_LABELS: Record<string, string> = {
  phrasal_verb:   "句動詞",
  idiom:          "イディオム",
  collocation:    "コロケーション",
  grammar_pattern:"文法パターン",
};

const TYPE_COLORS: Record<string, string> = {
  phrasal_verb:    "bg-violet-100 text-violet-700 border-violet-200",
  idiom:           "bg-amber-100  text-amber-700  border-amber-200",
  collocation:     "bg-sky-100    text-sky-700    border-sky-200",
  grammar_pattern: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-slate-100  text-slate-600",
  A2: "bg-green-100  text-green-700",
  B1: "bg-blue-100   text-blue-700",
  B2: "bg-indigo-100 text-indigo-700",
  C1: "bg-purple-100 text-purple-700",
  C2: "bg-rose-100   text-rose-700",
};

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

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

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const analysis = await getPublicAnalysis(params.id);
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
  const canonicalUrl = `${SITE_URL}/share/${params.id}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      type:        "article",
      url:         canonicalUrl,
      title:       `${pageTitle} | LinguistLens`,
      description,
      images: [{ url: "/og", width: 1200, height: 630 }],
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${pageTitle} | LinguistLens`,
      description,
      images:      ["/og"],
    },
    alternates: { canonical: canonicalUrl },
  };
}

// ─── PhraseCard（サーバー側 read-only）────────────────────────────────────────

function PhraseCard({ phrase }: { phrase: PhraseResult }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
            TYPE_COLORS[phrase.type] ?? "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {TYPE_LABELS[phrase.type] ?? phrase.type}
        </span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            CEFR_COLORS[phrase.cefr_level] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {phrase.cefr_level}
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 leading-tight mb-0.5">
        {phrase.expression}
      </h3>
      <p className="text-sm text-slate-500 mb-3 leading-snug">{phrase.meaning_ja}</p>

      <div className="bg-indigo-50 rounded-xl px-3 py-2 mb-2">
        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
          例文
        </p>
        <p className="text-xs text-indigo-700 font-medium leading-relaxed">
          {phrase.example}
        </p>
      </div>

      {phrase.nuance && (
        <p className="text-xs text-slate-400 leading-relaxed">{phrase.nuance}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SharePage({
  params,
}: {
  params: { id: string };
}) {
  const analysis = await getPublicAnalysis(params.id);
  if (!analysis) notFound();

  const { title, url, level, result, createdAt } = analysis;
  const pageTitle = buildTitle(title, url, level, result.total_count);

  const isYoutube = url?.includes("youtube.com") || url?.includes("youtu.be");
  const isWeb     = url && !isYoutube;

  return (
    <div className="min-h-screen relative">
      <SiteHeader
        maxWidth="3xl"
        right={
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
          >
            無料で試す →
          </Link>
        }
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CEFR_COLORS[level] ?? "bg-slate-100 text-slate-600"}`}>
              {level}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(createdAt).toLocaleDateString("ja-JP")}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            {pageTitle}
          </h1>

          {/* Source link */}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
            >
              {isYoutube ? (
                <Youtube className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-indigo-500" />
              )}
              <span className="truncate max-w-[280px]">{url}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          )}
          {!url && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <FileText className="h-3.5 w-3.5" />
              テキスト入力
            </span>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3.5 mb-8">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-indigo-600">{result.total_count}</p>
            <p className="text-[10px] text-indigo-400 font-medium">抽出表現</p>
          </div>
          {result.overall_level && (
            <>
              <div className="w-px h-8 bg-indigo-200" />
              <div className="text-center">
                <p className="text-2xl font-extrabold text-indigo-600">{result.overall_level}</p>
                <p className="text-[10px] text-indigo-400 font-medium">コンテンツレベル</p>
              </div>
            </>
          )}
          <div className="w-px h-8 bg-indigo-200" />
          <div className="text-sm text-indigo-700 font-medium">
            AIが{level}レベルに合わせて抽出した重要フレーズ集です
          </div>
        </div>

        {/* Ad */}
        <AdBanner className="mb-8" />

        {/* Phrase list */}
        <div className="space-y-3 mb-12">
          {result.phrases.map((phrase, i) => (
            <PhraseCard key={i} phrase={phrase} />
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 text-center text-white">
          <h2 className="text-xl font-extrabold mb-2">
            あなたのレベルで解析してみよう
          </h2>
          <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
            YouTubeやWeb記事のURLを貼るだけ。AIがあなたのCEFRレベルに合わせて<br />
            重要フレーズを自動抽出・日本語解説します。
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
          >
            無料で始める →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
