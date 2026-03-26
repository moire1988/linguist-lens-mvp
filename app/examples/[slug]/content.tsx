"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ExampleVideo } from "@/lib/examples-data";
import type { PhraseResult } from "@/lib/types";
import type { ExpressionType } from "@/lib/types";
import {
  savePhrase,
  getVocabulary,
  getVocabularyCount,
  getDailyRemaining,
  FREE_DAILY_LIMIT,
} from "@/lib/vocabulary";
import {
  saveVocabularyAction,
  listSavedExpressionKeysAction,
  getVocabularyCountAction,
} from "@/app/actions/vocabulary";
import { useEffectiveAuth } from "@/lib/dev-auth";
import { PhraseCard } from "@/components/phrase-card";
import { ScriptViewer } from "@/components/script-viewer";
import { UpgradeModal } from "@/components/upgrade-modal";
import { AdBanner } from "@/components/ad-banner";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import { getSettings, DEV_TEST_URL } from "@/lib/settings";
import { CEFR_CONTENT_META } from "@/lib/cefr-content-meta";

function getYouTubeId(url: string): string | null {
  const m = url.match(/[?&]v=([^&]{11})/);
  return m ? m[1] : null;
}

const CEFR_RANK: Record<string, number> = { A1:1, A2:2, B1:3, B2:4, C1:5, C2:6 };

const FILTER_OPTIONS: { value: "all" | ExpressionType; label: string }[] = [
  { value: "all",             label: "すべて"       },
  { value: "phrasal_verb",    label: "句動詞"       },
  { value: "idiom",           label: "イディオム"   },
  { value: "collocation",     label: "コロケーション" },
  { value: "grammar_pattern", label: "文法パターン" },
];


export function ExamplePageContent({ example }: { example: ExampleVideo }) {
  const { isSignedIn } = useAuth();
  const { isPro } = useEffectiveAuth();
  const [activeFilter, setActiveFilter] = useState<"all" | ExpressionType>("all");
  const [savedExpressions, setSavedExpressions] = useState<Set<string>>(new Set());
  const [dailyRemaining, setDailyRemaining] = useState(FREE_DAILY_LIMIT);
  const [vocabCount, setVocabCount] = useState(0);
  const [showPremium, setShowPremium] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn === undefined) return;
    if (!isSignedIn) {
      setVocabCount(getVocabularyCount());
      setSavedExpressions(
        new Set(getVocabulary().map((p) => p.expression.toLowerCase()))
      );
      setDailyRemaining(getDailyRemaining());
      return;
    }
    void listSavedExpressionKeysAction().then((keys) => {
      setSavedExpressions(new Set(keys));
    });
    void getVocabularyCountAction().then(setVocabCount);
    setDailyRemaining(999);
  }, [isSignedIn]);

  const handleSave = useCallback(
    async (phrase: PhraseResult) => {
      const key = phrase.expression.toLowerCase();
      if (savedExpressions.has(key)) return;

      if (!isSignedIn) {
        const result = savePhrase({
          expression: phrase.expression,
          type: phrase.type,
          cefr_level: phrase.cefr_level,
          meaning_ja: phrase.meaning_ja,
          nuance: phrase.nuance,
          example: phrase.example,
          example_translation: phrase.example_translation,
          context: phrase.context,
          why_hard_for_japanese: phrase.why_hard_for_japanese,
          sourceUrl: example.url,
        });
        if (result.success) {
          setSavedExpressions((s) => {
            const n = new Set(Array.from(s));
            n.add(key);
            return n;
          });
          setDailyRemaining((r) => Math.max(0, r - 1));
          setVocabCount((c) => c + 1);
          toast.success("保存しました", {
            description: `「${phrase.expression}」をマイページに追加しました`,
          });
        } else if (result.reason === "limit_reached") {
          setShowPremium(true);
        }
        return;
      }

      setSavingKey(key);
      try {
        const result = await saveVocabularyAction({
          expression: phrase.expression,
          type: phrase.type,
          cefr_level: phrase.cefr_level,
          meaning_ja: phrase.meaning_ja,
          nuance: phrase.nuance,
          example: phrase.example,
          example_translation: phrase.example_translation,
          context: phrase.context,
          why_hard_for_japanese: phrase.why_hard_for_japanese,
          sourceUrl: example.url,
          status: "learning",
        });
        if (result.success) {
          setSavedExpressions((s) => {
            const n = new Set(Array.from(s));
            n.add(key);
            return n;
          });
          setVocabCount((c) => c + 1);
          toast.success("保存しました", {
            description: `「${phrase.expression}」をマイページに追加しました`,
          });
        } else if (result.reason === "duplicate") {
          setSavedExpressions((s) => {
            const n = new Set(Array.from(s));
            n.add(key);
            return n;
          });
          void getVocabularyCountAction().then(setVocabCount);
          toast.info("この表現はすでに保存されています");
        } else {
          toast.error(result.error);
        }
      } finally {
        setSavingKey(null);
      }
    },
    [savedExpressions, example.url, isSignedIn]
  );

  const filtered = activeFilter === "all"
    ? example.phrases
    : example.phrases.filter((p) => p.type === activeFilter);

  const meta = CEFR_CONTENT_META[example.overallLevel];
  const gap = (CEFR_RANK[example.overallLevel] ?? 0) - CEFR_RANK["B2"];
  const youtubeId = getYouTubeId(example.url);

  return (
    <div className="min-h-screen relative">
      {showPremium && <UpgradeModal reason="vocab_limit" onClose={() => setShowPremium(false)} />}

      <SiteHeader
        maxWidth="5xl"
        right={
          <GlobalNav showVocabularyLink vocabCount={vocabCount} />
        }
      />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* ── Video info card ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {youtubeId ? (
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt={example.title}
                  className="w-[120px] h-[68px] object-cover rounded-xl flex-shrink-0 shadow-sm"
                />
              ) : (
                <span className="text-4xl leading-none flex-shrink-0">{example.emoji}</span>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight truncate">
                  {example.title}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">{example.sublabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-baseline gap-1 px-3 py-1.5 rounded-full border",
                  meta?.bg,
                  meta?.text,
                  meta?.border
                )}
              >
                <span className="text-[10px] font-normal leading-none">
                  コンテンツレベル
                </span>
                <span className="text-xs font-extrabold">{example.overallLevel}</span>
                {meta?.label != null && (
                  <span className="text-xs font-medium opacity-80">{meta.label}</span>
                )}
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

        {/* ── Ad ── */}
        <AdBanner className="mb-8" />

        {/* ── Full transcript ── */}
        <div className="mb-8">
          <ScriptViewer
            text={example.transcript}
            phrases={example.phrases}
            savedExpressions={savedExpressions}
            onSave={handleSave}
            savingExpressionKey={savingKey}
            showTranslate
            isPro={isPro}
            dailyRemaining={dailyRemaining}
          />
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
              savingExpressionKey={savingKey}
            />
          ))}
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
