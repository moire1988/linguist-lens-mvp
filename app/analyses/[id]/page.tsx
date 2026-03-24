import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Youtube, Globe, FileText } from "lucide-react";
import { getAnalysisAction } from "@/app/actions/save-analysis";
import type { PhraseResult } from "@/lib/types";
import { SiteHeader } from "@/components/site-header";

const SITE_URL = "https://linguist-lens-mvp.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const ogImageUrl = `${SITE_URL}/analyses/${params.id}/opengraph-image`;
  return {
    openGraph: {
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card:   "summary_large_image",
      images: [ogImageUrl],
    },
  };
}

// ─── 定数 ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  phrasal_verb:    "句動詞",
  idiom:           "イディオム",
  collocation:     "コロケーション",
  grammar_pattern: "文法パターン",
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

export default async function AnalysisDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // getAnalysisAction 内で auth() によるアクセス制御を実施。
  // - ゲスト解析（user_id=NULL）は UUID を知る誰でも閲覧可
  // - ログイン済みユーザーは自分の解析のみ閲覧可
  const analysis = await getAnalysisAction(params.id);
  if (!analysis) notFound();

  const { sourceUrl, cefrLevel, savedAt, data } = analysis;
  const isYoutube = data.source_type === "youtube";
  const isWeb     = data.source_type === "web" || (!isYoutube && !!sourceUrl);

  const ytId = sourceUrl?.match(/[?&]v=([^&]{11})/)?.[1]
    ?? sourceUrl?.match(/youtu\.be\/([^?&]{11})/)?.[1];

  const truncUrl = sourceUrl && sourceUrl.length > 60
    ? sourceUrl.slice(0, 57) + "…"
    : sourceUrl;

  return (
    <div className="min-h-screen relative">
      <SiteHeader maxWidth="3xl" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          別の動画を解析する
        </Link>

        {/* Hero */}
        <div className="mb-8">
          {/* YouTube thumbnail */}
          {ytId && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                alt="YouTube thumbnail"
                className="w-full max-h-48 object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CEFR_COLORS[cefrLevel] ?? "bg-slate-100 text-slate-600"}`}>
              {cefrLevel}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(savedAt).toLocaleDateString("ja-JP")}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            保存した解析結果
          </h1>

          {/* Source link */}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
            >
              {isYoutube ? (
                <Youtube className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-indigo-500" />
              )}
              <span className="truncate max-w-[280px]">{truncUrl}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <FileText className="h-3.5 w-3.5" />
              テキスト入力
            </span>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3.5 mb-8">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-indigo-600">{data.total_count}</p>
            <p className="text-[10px] text-indigo-400 font-medium">抽出表現</p>
          </div>
          {data.overall_level && (
            <>
              <div className="w-px h-8 bg-indigo-200" />
              <div className="text-center">
                <p className="text-2xl font-extrabold text-indigo-600">{data.overall_level}</p>
                <p className="text-[10px] text-indigo-400 font-medium">コンテンツレベル</p>
              </div>
            </>
          )}
          <div className="w-px h-8 bg-indigo-200" />
          <div className="text-sm text-indigo-700 font-medium flex-1">
            {cefrLevel}レベルに合わせて抽出した重要フレーズ集
          </div>
        </div>

        {/* Phrase list */}
        <div className="space-y-3 mb-12">
          {data.phrases.map((phrase, i) => (
            <PhraseCard key={i} phrase={phrase} />
          ))}
        </div>

        {/* Bottom nav */}
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            別の動画を解析する
          </Link>
          <Link
            href="/vocabulary"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            マイ単語帳を見る
          </Link>
        </div>
      </main>


    </div>
  );
}
