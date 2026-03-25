import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Youtube, Globe, FileText } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { getAnalysisAction, getAnalysisMetadataAction } from "@/app/actions/save-analysis";
import { AnalysisSharePanel } from "@/components/analysis-share-panel";
import { PaywallCTA } from "@/components/paywall-cta";
import type { PhraseResult } from "@/lib/types";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";

const SITE_URL = "https://linguist-lens-mvp.vercel.app";
const PAYWALL_THRESHOLD = 3; // ゲストに無料表示するフレーズ数

// ─── 動的メタデータ ────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const meta = await getAnalysisMetadataAction(params.id);

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
      url: `${SITE_URL}/analyses/${params.id}`,
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
  const { userId } = await auth();

  // getAnalysisAction 内で auth() によるアクセス制御を実施。
  // - is_public=true → 誰でも閲覧可（ゲストにはペイウォールを表示）
  // - is_public=false, ゲスト解析（user_id=NULL）→ UUID を知る誰でも閲覧可
  // - is_public=false, user_id 付き → オーナーのみ閲覧可
  const analysis = await getAnalysisAction(params.id);
  if (!analysis) notFound();

  const { sourceUrl, cefrLevel, savedAt, data, isPublic, isOwner } = analysis;

  // ペイウォール判定: ゲスト（未ログイン）かつ公開記事の場合
  const showPaywall = !userId;

  const isYoutube = data.source_type === "youtube";

  const ytId = sourceUrl?.match(/[?&]v=([^&]{11})/)?.[1]
    ?? sourceUrl?.match(/youtu\.be\/([^?&]{11})/)?.[1];

  const truncUrl = sourceUrl && sourceUrl.length > 60
    ? sourceUrl.slice(0, 57) + "…"
    : sourceUrl;

  const shareUrl = `${SITE_URL}/analyses/${params.id}`;

  // ペイウォール用: 表示するフレーズと隠すフレーズを分割
  const visiblePhrases = showPaywall
    ? data.phrases.slice(0, PAYWALL_THRESHOLD)
    : data.phrases;
  const blurredPhrases = showPaywall
    ? data.phrases.slice(PAYWALL_THRESHOLD, PAYWALL_THRESHOLD + 2)
    : [];

  return (
    <div className="min-h-screen relative">
      <SiteHeader maxWidth="3xl" right={<GlobalNav />} />

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
            {cefrLevel}レベルの英語表現 {data.total_count}選
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

        {/* ── シェアパネル（オーナーのみ表示） ── */}
        <AnalysisSharePanel
          analysisId={params.id}
          initialIsPublic={isPublic}
          isOwner={isOwner}
          shareUrl={shareUrl}
          phraseCount={data.total_count}
          cefrLevel={cefrLevel}
        />

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

        {/* ── Phrase list ── */}
        <div className="mb-12">
          {/* 全表示フレーズ（ログイン済み or ゲストの先頭 N 件） */}
          <div className="space-y-3">
            {visiblePhrases.map((phrase, i) => (
              <PhraseCard key={i} phrase={phrase} />
            ))}
          </div>

          {/* ペイウォール: ゲストに残りをチラ見せ → CTA */}
          {showPaywall && data.total_count > PAYWALL_THRESHOLD && (
            <div className="mt-3">
              {/* ぼかしプレビュー */}
              {blurredPhrases.length > 0 && (
                <div className="relative">
                  <div className="space-y-3 blur-[3px] opacity-50 pointer-events-none select-none">
                    {blurredPhrases.map((phrase, i) => (
                      <PhraseCard key={i} phrase={phrase} />
                    ))}
                  </div>
                  {/* フェードアウトグラデーション */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 0%, #f7f8ff 80%)",
                    }}
                  />
                </div>
              )}

              {/* CTA カード */}
              <div className="mt-4">
                <PaywallCTA
                  totalCount={data.total_count}
                  shownCount={PAYWALL_THRESHOLD}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav（ログイン済みのみ） */}
        {!showPaywall && (
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
        )}
      </main>
    </div>
  );
}
