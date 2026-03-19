"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookOpen, BookMarked, ExternalLink, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ExampleVideo } from "@/lib/examples-data";
import type { PhraseResult } from "@/lib/types";
import type { ExpressionType } from "@/app/actions/analyze";
import { savePhrase, getVocabulary, getVocabularyCount, getDailyRemaining, FREE_DAILY_LIMIT } from "@/lib/vocabulary";
import { PhraseCard } from "@/components/phrase-card";
import { PremiumModal } from "@/components/premium-modal";
import { MeshBackground } from "@/components/mesh-background";

const CEFR_RANK: Record<string, number> = { A1:1, A2:2, B1:3, B2:4, C1:5, C2:6 };
const CEFR_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  A1: { label:"入門",   bg:"bg-slate-100",  text:"text-slate-700",  border:"border-slate-200"  },
  A2: { label:"初級",   bg:"bg-green-100",  text:"text-green-700",  border:"border-green-200"  },
  B1: { label:"中級",   bg:"bg-blue-100",   text:"text-blue-700",   border:"border-blue-200"   },
  B2: { label:"中上級", bg:"bg-indigo-100", text:"text-indigo-700", border:"border-indigo-200" },
  C1: { label:"上級",   bg:"bg-purple-100", text:"text-purple-700", border:"border-purple-200" },
  C2: { label:"熟達",   bg:"bg-rose-100",   text:"text-rose-700",   border:"border-rose-200"   },
};

const FILTER_OPTIONS: { value: "all" | ExpressionType; label: string }[] = [
  { value: "all",             label: "すべて"       },
  { value: "phrasal_verb",    label: "句動詞"       },
  { value: "idiom",           label: "イディオム"   },
  { value: "collocation",     label: "コロケーション" },
  { value: "grammar_pattern", label: "文法パターン" },
];

/** Build HTML string with extracted expressions highlighted via <mark> tags. */
function buildHighlightedHtml(transcript: string, phrases: PhraseResult[]): string {
  const paras = transcript
    .split(/\n\n+/)
    .map((p) =>
      p
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")
    );

  let html = paras.map((p) => `<p>${p}</p>`).join("\n");

  // Longest expression first to avoid partial matches
  const sorted = [...phrases].sort((a, b) => b.expression.length - a.expression.length);
  for (const phrase of sorted) {
    const escaped = phrase.expression.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b(${escaped})\\b`, "gi");
    html = html.replace(regex, "<mark>$1</mark>");
  }

  return html;
}

export function ExamplePageContent({ example }: { example: ExampleVideo }) {
  const [activeFilter, setActiveFilter] = useState<"all" | ExpressionType>("all");
  const [savedExpressions, setSavedExpressions] = useState<Set<string>>(new Set());
  const [dailyRemaining, setDailyRemaining] = useState(FREE_DAILY_LIMIT);
  const [vocabCount, setVocabCount] = useState(0);
  const [showPremium, setShowPremium] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    setVocabCount(getVocabularyCount());
    setSavedExpressions(new Set(getVocabulary().map((p) => p.expression.toLowerCase())));
    setDailyRemaining(getDailyRemaining());
  }, []);

  const handleSave = useCallback((phrase: PhraseResult) => {
    const key = phrase.expression.toLowerCase();
    if (savedExpressions.has(key)) return;
    const result = savePhrase({
      expression: phrase.expression,
      type: phrase.type,
      cefr_level: phrase.cefr_level,
      meaning_ja: phrase.meaning_ja,
      nuance: phrase.nuance,
      example: phrase.example,
      context: phrase.context,
      why_hard_for_japanese: phrase.why_hard_for_japanese,
      sourceUrl: example.url,
    });
    if (result.success) {
      setSavedExpressions((s) => { const n = new Set(Array.from(s)); n.add(key); return n; });
      setDailyRemaining((r) => Math.max(0, r - 1));
      setVocabCount((c) => c + 1);
      toast.success("単語帳に保存しました", {
        description: `「${phrase.expression}」をマイ単語帳に追加しました`,
      });
    } else if (result.reason === "limit_reached") {
      setShowPremium(true);
    }
  }, [savedExpressions, example.url]);

  const filtered = activeFilter === "all"
    ? example.phrases
    : example.phrases.filter((p) => p.type === activeFilter);

  const meta = CEFR_META[example.overallLevel];
  const gap = (CEFR_RANK[example.overallLevel] ?? 0) - CEFR_RANK["B2"];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f8ff" }}>
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}

      {/* ── Animated SVG mesh background ── */}
      <MeshBackground />

      {/* ── Header ── */}
      <header className="border-b border-slate-100 bg-white/70 backdrop-blur-sm sticky top-0 z-10 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span className="font-bold text-slate-800 tracking-tight">LinguistLens</span>
          </Link>
          <Link
            href="/vocabulary"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-100 transition-colors"
          >
            <BookMarked className="h-3.5 w-3.5" />
            マイ単語帳
            {vocabCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {vocabCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* ── Video info card ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-4xl leading-none flex-shrink-0">{example.emoji}</span>
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight truncate">
                  {example.title}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">{example.sublabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "text-xs font-extrabold px-3 py-1.5 rounded-full border",
                meta?.bg, meta?.text, meta?.border
              )}>
                総合 {example.overallLevel}
                <span className="ml-1 font-medium opacity-80">{meta?.label}</span>
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                対象: {example.cefrRange}（{example.cefrRangeLabel}）
              </span>
              <a
                href={example.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                YouTube
              </a>
            </div>
          </div>

          {/* Advice */}
          <div className="mt-4">
            {gap >= 2 && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <span className="text-base mt-0.5">💡</span>
                <p className="text-sm text-amber-800">
                  このコンテンツは中上級者（B2）より<span className="font-bold">{gap}段階</span>上の難易度です。難しく感じても大丈夫！まずフレーズを一つずつ押さえましょう。
                </p>
              </div>
            )}
            {gap === 0 && (
              <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <span className="text-base mt-0.5">✨</span>
                <p className="text-sm text-indigo-800">
                  ちょうど背伸びできる難易度のコンテンツです。理想的な学習素材！
                </p>
              </div>
            )}
            {gap < 0 && (
              <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                <span className="text-base mt-0.5">📘</span>
                <p className="text-sm text-sky-800">
                  やさしめのコンテンツです。表現のニュアンスや使い分けを深掘りしてみましょう。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Results header ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-indigo-600">{example.phrases.length}</span>
            <span className="text-sm text-slate-600">個の表現を抽出</span>
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
              ⚡ 静的キャッシュ
            </span>
          </div>
        </div>

        {/* ── Filter pills ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {FILTER_OPTIONS.filter((opt) => {
            if (opt.value === "all") return true;
            return example.phrases.some((p) => p.type === opt.value);
          }).map((opt) => {
            const count = opt.value === "all"
              ? example.phrases.length
              : example.phrases.filter((p) => p.type === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setActiveFilter(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  activeFilter === opt.value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
                )}
              >
                {opt.label}
                <span className={cn("ml-1.5 font-bold", activeFilter === opt.value ? "text-indigo-200" : "text-slate-400")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Phrase cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filtered.map((phrase, i) => (
            <PhraseCard
              key={`${phrase.expression}-${i}`}
              phrase={phrase}
              savedExpressions={savedExpressions}
              dailyRemaining={dailyRemaining}
              onSave={handleSave}
            />
          ))}
        </div>

        {/* ── Full transcript (accordion) ── */}
        <div className="mb-10">
          <button
            onClick={() => setTranscriptOpen(!transcriptOpen)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:bg-white hover:border-indigo-200 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700">全文スクリプト</span>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full hidden sm:inline">
                抽出された表現をハイライト表示
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0",
                transcriptOpen && "rotate-180"
              )}
            />
          </button>

          {transcriptOpen && (
            <div className="mt-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              {/* Legend */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <span
                  className="inline-block text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "rgba(199,210,254,0.65)", color: "#3730a3" }}
                >
                  highlight
                </span>
                <span className="text-xs text-slate-500">= このページで紹介した表現</span>
              </div>

              {/* Transcript with highlights */}
              <div
                className="transcript-content text-sm text-slate-700 leading-relaxed max-h-[420px] overflow-y-auto pr-1"
                dangerouslySetInnerHTML={{
                  __html: buildHighlightedHtml(example.transcript, example.phrases),
                }}
              />
            </div>
          )}
        </div>

        {/* ── CTA ── */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-center text-white">
          <h2 className="text-lg sm:text-xl font-extrabold mb-2">
            自分のコンテンツで試してみよう
          </h2>
          <p className="text-indigo-200 text-sm mb-5 max-w-md mx-auto">
            YouTube・Web記事のURLを貼るだけ。<br />
            あなたのCEFRレベルに合ったフレーズをAIがリアルタイムで抽出します。
          </p>
          <div className="flex justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors"
            >
              別のコンテンツを解析する
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
