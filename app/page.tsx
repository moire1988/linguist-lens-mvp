"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { EXAMPLES } from "@/lib/examples-data";
import {
  Search,
  Youtube,
  Globe,
  BookOpen,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
  BookmarkPlus,
  ChevronRight,
  Tv,
  Check,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  analyzeContent,
  type AnalysisResult,
  type ExpressionType,
} from "@/app/actions/analyze";
import { savePhrase, getVocabulary, getVocabularyCount, getDailyRemaining, FREE_DAILY_LIMIT } from "@/lib/vocabulary";
import type { PhraseResult } from "@/lib/types";
import { getCachedResult, setCachedResult } from "@/lib/cache";
import { PremiumModal } from "@/components/premium-modal";
import { PhraseCard } from "@/components/phrase-card";
import { ScriptViewer } from "@/components/script-viewer";
import { AdPlaceholder } from "@/components/ad-placeholder";

// ─── Constants ─────────────────────────────────────────────────────────────

const CEFR_LEVELS = [
  {
    value: "A1",
    label: "A1",
    description: "入門",
    toeic: "〜225",
    toefl: null,
    color: "slate",
  },
  {
    value: "A2",
    label: "A2",
    description: "初級",
    toeic: "225〜549",
    toefl: null,
    color: "green",
  },
  {
    value: "B1",
    label: "B1",
    description: "中級",
    toeic: "550〜780",
    toefl: "42〜71",
    color: "blue",
  },
  {
    value: "B2",
    label: "B2",
    description: "中上級",
    toeic: "785〜940",
    toefl: "72〜94",
    color: "indigo",
  },
  {
    value: "C1",
    label: "C1",
    description: "上級",
    toeic: "945〜990",
    toefl: "95〜120",
    color: "purple",
  },
  {
    value: "C2",
    label: "C2",
    description: "熟達",
    toeic: null,
    toefl: null,
    color: "rose",
  },
];

const FILTER_OPTIONS: { value: "all" | ExpressionType; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "phrasal_verb", label: "句動詞" },
  { value: "idiom", label: "イディオム" },
  { value: "collocation", label: "コロケーション" },
  { value: "grammar_pattern", label: "文法パターン" },
];

const LOADING_STEPS = [
  "コンテンツを取得中...",
  "AIが表現を解析中...",
  "結果を整理中...",
];

const SOURCE_LABELS = {
  youtube: { label: "YouTube", icon: "🎬" },
  web: { label: "Web記事", icon: "🌐" },
  text: { label: "テキスト入力", icon: "📄" },
};

// SAMPLE_VIDEOS は lib/examples-data.ts の EXAMPLES を使用

const CEFR_RANK: Record<string, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6,
};

const CEFR_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  A1: { label: "入門",   bg: "bg-slate-100",  text: "text-slate-700",  border: "border-slate-200"  },
  A2: { label: "初級",   bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200"  },
  B1: { label: "中級",   bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200"   },
  B2: { label: "中上級", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  C1: { label: "上級",   bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  C2: { label: "熟達",   bg: "bg-rose-100",   text: "text-rose-700",   border: "border-rose-200"   },
};

// ─── Page Component ────────────────────────────────────────────────────────

export default function HomePage() {
  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("B2");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | ExpressionType>("all");
  const [stepIndex, setStepIndex] = useState(0);
  const [allSaved, setAllSaved] = useState(false);
  const [vocabCount, setVocabCount] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [savedExpressions, setSavedExpressions] = useState<Set<string>>(new Set());
  const [dailyRemaining, setDailyRemaining] = useState(FREE_DAILY_LIMIT);

  // 単語帳の件数・保存済みセット・残り回数をロード
  useEffect(() => {
    setVocabCount(getVocabularyCount());
    setSavedExpressions(new Set(getVocabulary().map((p) => p.expression.toLowerCase())));
    setDailyRemaining(getDailyRemaining());
  }, []);

  const [isPending, startTransition] = useTransition();

  // Detect URL type
  const inputValue = inputMode === "url" ? url : textInput;
  const urlType =
    url.includes("youtube.com") || url.includes("youtu.be")
      ? "youtube"
      : url.startsWith("http")
      ? "web"
      : null;

  // Animate loading steps
  useEffect(() => {
    if (!isPending) {
      setStepIndex(0);
      return;
    }
    setStepIndex(0);
    const t1 = setTimeout(() => setStepIndex(1), 2500);
    const t2 = setTimeout(() => setStepIndex(2), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isPending]);

  // Run analysis
  const handleSubmit = useCallback(() => {
    setError(null);
    setResults(null);
    setAllSaved(false);
    setFromCache(false);
    setActiveFilter("all");
    setSourceUrl(inputMode === "url" ? url : undefined);

    // キャッシュチェック（URLモードのみ）
    if (inputMode === "url" && url.trim()) {
      const cached = getCachedResult(url.trim(), selectedLevel);
      if (cached) {
        setResults(cached);
        setFromCache(true);
        toast.success("キャッシュから読み込みました", {
          description: "API呼び出しをスキップしました（7日間有効）",
        });
        return;
      }
    }

    startTransition(async () => {
      const result = await analyzeContent(inputValue, selectedLevel, inputMode);
      if (result.success) {
        setResults(result.data);
        // URLモードの結果をキャッシュ保存
        if (inputMode === "url" && url.trim()) {
          setCachedResult(url.trim(), selectedLevel, result.data);
        }
        if (result.data.total_count === 0) {
          setError("抽出できる表現が見つかりませんでした。別のコンテンツをお試しください。");
        }
      } else {
        setError(result.error);
      }
    });
  }, [inputValue, url, selectedLevel, inputMode]);

  // Sample video quick-submit (URL is passed directly, bypasses state timing)
  const handleQuickSubmit = useCallback(
    (videoUrl: string) => {
      setUrl(videoUrl);
      setInputMode("url");
      setError(null);
      setResults(null);
      setAllSaved(false);
      setFromCache(false);
      setActiveFilter("all");
      setSourceUrl(videoUrl);

      const cached = getCachedResult(videoUrl, selectedLevel);
      if (cached) {
        setResults(cached);
        setFromCache(true);
        toast.success("キャッシュから読み込みました", {
          description: "API呼び出しをスキップしました（7日間有効）",
        });
        return;
      }

      startTransition(async () => {
        const result = await analyzeContent(videoUrl, selectedLevel, "url");
        if (result.success) {
          setResults(result.data);
          setCachedResult(videoUrl, selectedLevel, result.data);
          if (result.data.total_count === 0) {
            setError("抽出できる表現が見つかりませんでした。別のコンテンツをお試しください。");
          }
        } else {
          setError(result.error);
        }
      });
    },
    [selectedLevel]
  );

  // Filtered results
  const filteredPhrases =
    results?.phrases.filter(
      (p) => activeFilter === "all" || p.type === activeFilter
    ) ?? [];

  // 全件を単語帳に保存
  const handleSaveAll = useCallback(() => {
    if (!results || allSaved) return;
    let count = 0;
    const newKeys: string[] = [];
    for (const phrase of results.phrases) {
      const res = savePhrase({
        expression: phrase.expression,
        type: phrase.type,
        cefr_level: phrase.cefr_level,
        meaning_ja: phrase.meaning_ja,
        nuance: phrase.nuance,
        example: phrase.example,
        context: phrase.context,
        why_hard_for_japanese: phrase.why_hard_for_japanese,
        sourceUrl,
      });
      if (res.success) {
        count++;
        newKeys.push(phrase.expression.toLowerCase());
      } else if (res.reason === "limit_reached") {
        setShowPremium(true);
        if (count > 0) {
          setSavedExpressions((s) => { const n = new Set(Array.from(s)); newKeys.forEach((k) => n.add(k)); return n; });
          setDailyRemaining(getDailyRemaining());
          setVocabCount(getVocabularyCount());
          toast.success(`${count}件保存しました`, {
            description: "本日の上限に達しました。残りはプレミアムプランで保存できます。",
          });
        }
        return;
      }
    }
    setSavedExpressions((s) => { const n = new Set(Array.from(s)); newKeys.forEach((k) => n.add(k)); return n; });
    setDailyRemaining(getDailyRemaining());
    setAllSaved(true);
    setVocabCount(getVocabularyCount());
    toast.success("単語帳にすべて保存しました", {
      description: `${count}個の表現を追加しました`,
    });
  }, [results, sourceUrl, allSaved]);

  // 個別保存（ScriptViewer / PhraseCard 共通）
  const handleSavePhrase = useCallback(
    (phrase: PhraseResult) => {
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
        sourceUrl,
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
    },
    [savedExpressions, sourceUrl]
  );

  const canSubmit =
    inputMode === "url" ? url.trim().length > 0 : textInput.trim().length > 10;

  const hasContent = isPending || !!results || !!error;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "#f7f8ff" }}>
      {/* Animated mesh background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="animate-blob-1 absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl" />
        <div className="animate-blob-2 absolute top-1/2 -right-48 w-[420px] h-[420px] rounded-full bg-purple-200/15 blur-3xl" />
        <div className="animate-blob-3 absolute -bottom-48 left-1/4 w-[460px] h-[460px] rounded-full bg-blue-200/15 blur-3xl" />
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
      </div>
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      {/* ── Header ── */}
      <header className="border-b border-slate-100 bg-white/70 backdrop-blur-sm sticky top-0 z-10 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span className="font-bold text-slate-800 tracking-tight">
              LinguistLens
            </span>
          </div>
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

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* ── Hero（常に表示） ── */}
        <div className={cn("text-center", hasContent ? "mb-8" : "mb-10")}>
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
              <Sparkles className="h-3 w-3" />
              AI powered · CEFR / TOEIC / TOEFL 対応
            </span>
          </div>
          <h1 className={cn(
            "font-extrabold text-slate-900 tracking-tight mb-4",
            hasContent
              ? "text-2xl sm:text-3xl leading-snug"
              : "text-3xl sm:text-[2.75rem] leading-snug sm:leading-[1.35]"
          )}>
            英語コンテンツから
            <br />
            <span className="text-indigo-600">本当に使える表現</span>だけを抽出
          </h1>
          {!hasContent && (
            <p className="text-slate-500 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              YouTube・Web記事のURLを貼るだけ。
              <br className="hidden sm:block" />
              あなたのレベルに合わせ、AIが句動詞・イディオムを
              <br className="hidden sm:block" />
              ニュアンス解説付きでリストアップします。
            </p>
          )}
        </div>

        {/* ── Input Card ── */}
        <div
          className={cn(
            "max-w-2xl mx-auto",
            (isPending || results || error) && "mb-10"
          )}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
            {/* Mode toggle */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
              <button
                onClick={() => setInputMode("url")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                  inputMode === "url"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                URL解析
              </button>
              <button
                onClick={() => setInputMode("text")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                  inputMode === "text"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                テキスト入力
              </button>
            </div>

            {/* URL input */}
            {inputMode === "url" && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  URLを入力
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {urlType === "youtube" ? (
                      <Youtube className="h-4 w-4 text-red-500" />
                    ) : urlType === "web" ? (
                      <Globe className="h-4 w-4 text-indigo-500" />
                    ) : (
                      <Search className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=...  または記事URL"
                    className={cn(
                      "w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors outline-none",
                      "placeholder:text-slate-400 text-slate-800",
                      "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50",
                      urlType === "youtube"
                        ? "border-red-200 bg-red-50/40"
                        : urlType === "web"
                        ? "border-indigo-200 bg-indigo-50/30"
                        : "border-slate-200 bg-slate-50/50"
                    )}
                  />
                </div>
                {urlType && (
                  <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                    {urlType === "youtube" ? (
                      <>
                        <Youtube className="h-3 w-3 text-red-400" />
                        YouTube動画の字幕を自動取得します
                      </>
                    ) : (
                      <>
                        <Globe className="h-3 w-3 text-indigo-400" />
                        Web記事のテキストを抽出します
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Text input (Netflix / direct paste) */}
            {inputMode === "text" && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  テキストを入力
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-2 text-xs text-slate-500">
                  <Tv className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  Netflix のセリフや、コピーした英語テキストをそのまま貼り付けてください
                </div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={"例：\n\"I just wanted to reach out and say that what you've been pulling off these past few months is nothing short of remarkable...\"\n\nNetflixのセリフ、書籍の一節、英語記事など何でも対応"}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none resize-none leading-relaxed"
                />
                <p className="mt-1.5 text-xs text-slate-400 text-right">
                  {textInput.length} 文字
                </p>
              </div>
            )}

            {/* CEFR Level Selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                あなたの英語レベル（CEFR）
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {CEFR_LEVELS.map((level) => {
                  const isSelected = selectedLevel === level.value;
                  return (
                    <button
                      key={level.value}
                      onClick={() => setSelectedLevel(level.value)}
                      className={cn(
                        "relative p-2.5 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      )}
                      <div
                        className={cn(
                          "text-base font-extrabold leading-none mb-0.5",
                          isSelected ? "text-indigo-700" : "text-slate-700"
                        )}
                      >
                        {level.label}
                      </div>
                      <div
                        className={cn(
                          "text-[10px] font-medium leading-tight",
                          isSelected ? "text-indigo-500" : "text-slate-400"
                        )}
                      >
                        {level.description}
                      </div>
                      {level.toeic && (
                        <div className="text-[9px] text-slate-400 mt-1 leading-tight">
                          {level.toeic}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected level detail */}
              {(() => {
                const level = CEFR_LEVELS.find(
                  (l) => l.value === selectedLevel
                )!;
                return (
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-400">
                    {level.toeic && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                        TOEIC: {level.toeic}
                      </span>
                    )}
                    {level.toefl && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                        TOEFL iBT: {level.toefl}
                      </span>
                    )}
                    {!level.toeic && !level.toefl && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                        ネイティブ近傍レベル
                      </span>
                    )}
                    <span>以上の表現を抽出します</span>
                  </div>
                );
              })()}
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl",
                "font-semibold text-sm transition-all",
                canSubmit && !isPending
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md active:scale-[0.99]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_STEPS[stepIndex]}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AIで表現を抽出する
                  {canSubmit && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Sample Videos ── */}
        {inputMode === "url" && !hasContent && (
          <div className="max-w-2xl mx-auto mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                👇 まずは人気の動画で試す
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {EXAMPLES.map((v) => (
                <Link
                  key={v.slug}
                  href={`/examples/${v.slug}`}
                  className="flex flex-col items-center gap-1.5 p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/70 hover:shadow-sm transition-all text-center group"
                >
                  <span className="text-2xl leading-none">{v.emoji}</span>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 leading-tight transition-colors">
                    {v.title}
                  </span>
                  <span className="text-[10px] text-slate-400 mb-0.5">{v.sublabel}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {v.cefrRange}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {isPending && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-5">
              <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
              <span className="text-sm text-slate-500">
                {LOADING_STEPS[stepIndex]}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                i === 3 ? (
                  <AdPlaceholder key="ad-loading" slot="解析待機中 · 300×250" size="md" className="min-h-[140px]" />
                ) : (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse"
                  >
                    <div className="flex gap-2 mb-3">
                      <div className="h-5 w-16 bg-slate-100 rounded-full" />
                      <div className="h-5 w-8 bg-slate-100 rounded-full" />
                    </div>
                    <div className="h-7 w-3/4 bg-slate-100 rounded-lg mb-3" />
                    <div className="h-12 bg-slate-50 rounded-xl mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="h-3 bg-slate-100 rounded w-5/6" />
                      <div className="h-3 bg-slate-100 rounded w-4/6" />
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && !isPending && (
          <div className="max-w-2xl mx-auto mt-4">
            <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 mb-0.5">
                  エラーが発生しました
                </p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Results Dashboard ── */}
        {results && !isPending && results.total_count > 0 && (
          <div className="max-w-5xl mx-auto">
            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <span className="text-2xl font-extrabold text-indigo-600">
                    {results.total_count}
                  </span>
                  <span>個の表現が見つかりました</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {SOURCE_LABELS[results.source_type].icon}{" "}
                  {SOURCE_LABELS[results.source_type].label}
                </span>
                {fromCache && (
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                    ⚡ キャッシュ
                  </span>
                )}
              </div>

              {/* Save all to vocabulary */}
              <button
                onClick={handleSaveAll}
                disabled={allSaved}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                  allSaved
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
                )}
              >
                {allSaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    全て保存済み
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" />
                    単語帳に全て保存
                  </>
                )}
              </button>
            </div>

            {/* ── Overall Level Badge ── */}
            {results.overall_level && (() => {
              const meta = CEFR_META[results.overall_level];
              const gap = (CEFR_RANK[results.overall_level] ?? 0) - (CEFR_RANK[selectedLevel] ?? 0);
              return (
                <div className="mb-5 space-y-2">
                  {/* Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">
                      コンテンツの総合難易度
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-extrabold border",
                        meta?.bg ?? "bg-slate-100",
                        meta?.text ?? "text-slate-700",
                        meta?.border ?? "border-slate-200"
                      )}
                    >
                      {results.overall_level}
                      <span className="font-medium text-xs opacity-80">
                        {meta?.label}
                      </span>
                    </span>
                  </div>

                  {/* Advice message */}
                  {gap >= 2 && (
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <span className="text-base leading-none mt-0.5">💡</span>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        このコンテンツはあなたの現在のレベル（
                        <span className="font-bold">{selectedLevel}</span>）より
                        <span className="font-bold">{gap}段階</span>
                        上の難易度です。難しく感じても大丈夫！
                        抽出されたフレーズを一つずつ押さえていきましょう。
                      </p>
                    </div>
                  )}
                  {gap === 1 && (
                    <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                      <span className="text-base leading-none mt-0.5">✨</span>
                      <p className="text-sm text-emerald-800 leading-relaxed">
                        ちょうど背伸びできる難易度です。理想的な学習素材です！
                      </p>
                    </div>
                  )}
                  {gap < 0 && (
                    <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                      <span className="text-base leading-none mt-0.5">📘</span>
                      <p className="text-sm text-sky-800 leading-relaxed">
                        あなたのレベルに対してやさしめのコンテンツです。
                        表現のニュアンスや使い分けを深掘りしてみましょう。
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Script viewer with highlights */}
            {(results.source_text || results.full_script_with_highlight) && (
              <ScriptViewer
                text={results.source_text ?? ""}
                phrases={results.phrases}
                highlightedHtml={results.full_script_with_highlight}
                savedExpressions={savedExpressions}
                onSave={handleSavePhrase}
              />
            )}

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {FILTER_OPTIONS.filter((opt) => {
                if (opt.value === "all") return true;
                return results.phrases.some((p) => p.type === opt.value);
              }).map((opt) => {
                const count =
                  opt.value === "all"
                    ? results.total_count
                    : results.phrases.filter((p) => p.type === opt.value)
                        .length;
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
                    <span
                      className={cn(
                        "ml-1.5 font-bold",
                        activeFilter === opt.value
                          ? "text-indigo-200"
                          : "text-slate-400"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Phrase cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPhrases.map((phrase, i) => (
                <>
                  <PhraseCard
                    key={`${phrase.expression}-${i}`}
                    phrase={phrase}
                    savedExpressions={savedExpressions}
                    dailyRemaining={dailyRemaining}
                    onSave={handleSavePhrase}
                  />
                  {/* 6枚ごとに広告プレースホルダー */}
                  {(i + 1) % 6 === 0 && i + 1 < filteredPhrases.length && (
                    <AdPlaceholder
                      key={`ad-${i}`}
                      slot="結果フィード広告 · 336×280"
                      size="md"
                      className="sm:col-span-2 lg:col-span-1"
                    />
                  )}
                </>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      {!hasContent && (
        <footer className="border-t border-slate-100 py-6 mt-4">
          <p className="text-center text-xs text-slate-400">
            © 2024 LinguistLens · Powered by Claude AI
          </p>
        </footer>
      )}
    </div>
  );
}
