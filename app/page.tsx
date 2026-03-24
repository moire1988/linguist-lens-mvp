"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Youtube,
  Globe,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
  BookmarkPlus,
  ChevronRight,
  Tv,
  Check,
  BookMarked,
  Settings,
  Save,
  Wand2,
  Library,
} from "lucide-react";
import { useAuth, useClerk, UserButton } from "@clerk/nextjs";
import { useEffectiveAuth } from "@/lib/dev-auth";
import { saveAnalysisAction } from "@/app/actions/save-analysis";
import { saveVocabularyAction } from "@/app/actions/vocabulary";
import { savePublicAnalysis } from "@/app/actions/save-public-analysis";
import { consumeQuotaAction } from "@/app/actions/check-quota";
import { UpgradeModal } from "@/components/upgrade-modal";
import { Rocket, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  analyzeContent,
  type AnalysisResult,
  type ExpressionType,
} from "@/app/actions/analyze";
import { generateArticle } from "@/app/actions/generate-article";
import { savePhrase, getVocabulary, getVocabularyCount, getDailyRemaining, FREE_DAILY_LIMIT } from "@/lib/vocabulary";
import type { PhraseResult } from "@/lib/types";
import { getCachedResult, setCachedResult } from "@/lib/cache";
import { PhraseCard } from "@/components/phrase-card";
import { ScriptViewer } from "@/components/script-viewer";
import { AdPlaceholder } from "@/components/ad-placeholder";
import { SettingsModal } from "@/components/settings-modal";
import { OnboardingModal } from "@/components/onboarding-modal";
import { SiteFooter } from "@/components/site-footer";
import { NewsletterBanner } from "@/components/newsletter-banner";
import { RecommendedCarousel } from "@/components/recommended-carousel";
import { LatestArticlesCarousel } from "@/components/latest-articles-carousel";
import { SiteHeader, HeaderLogo } from "@/components/site-header";
import {
  getSettings,
  saveSettings,
  DEV_TEST_URL,
  hasCompletedOnboarding,
  hasSavedSettings,
  markOnboardingCompleted,
  type CefrLevel,
  type Accent,
  type DevAuthState,
} from "@/lib/settings";
import {
  saveAnalysis,
  getSavedAnalyses,
  getPendingRestore,
  ANALYSIS_MAX_SLOTS,
} from "@/lib/saved-analyses";
import { openLoginPrompt } from "@/lib/login-prompt-store";
import {
  getRecentPublicAnalysesAction,
  type RecentPublicAnalysis,
} from "@/app/actions/public-analyses";
import { RECOMMENDED_VIDEOS } from "@/lib/recommended-videos-data";

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

/** `recommended-videos-data` から YouTube 視聴 URL の候補を生成 */
function getRecommendedVideoUrlCandidates(): string[] {
  return RECOMMENDED_VIDEOS.filter((v) => v.youtubeId.trim().length > 0).map(
    (v) => `https://www.youtube.com/watch?v=${v.youtubeId.trim()}`
  );
}

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
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [savedExpressions, setSavedExpressions] = useState<Set<string>>(new Set());
  const [dailyRemaining, setDailyRemaining] = useState(FREE_DAILY_LIMIT);
  const { isSignedIn, userId } = useAuth();
  const { openSignIn } = useClerk();
  const { isPro } = useEffectiveAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [devAuthState, setDevAuthState] = useState<DevAuthState>("real");
  const [analysisSaved, setAnalysisSaved] = useState(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [savedAnalysisSlots, setSavedAnalysisSlots] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [publicSaveUrl, setPublicSaveUrl] = useState<string | null>(null);
  const [isPublicSaving, setIsPublicSaving] = useState(false);
  const [recentPublicAnalyses, setRecentPublicAnalyses] = useState<RecentPublicAnalysis[]>([]);
  const [urlInputGlow, setUrlInputGlow] = useState(false);
  const [isUrlTyping, setIsUrlTyping] = useState(false);
  const urlTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 管理者かつ devMode ON の場合のみ公開保存ボタンを表示
  const isAdmin = isSignedIn && userId === process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  const showPublicSaveButton = isAdmin && devMode;

  // 単語帳の件数・保存済みセット・残り回数、設定をロード
  useEffect(() => {
    setVocabCount(getVocabularyCount());
    setSavedExpressions(new Set(getVocabulary().map((p) => p.expression.toLowerCase())));
    setDailyRemaining(getDailyRemaining());
    const s = getSettings();
    setSelectedLevel(s.defaultLevel);
    setDevMode(s.devMode);
    setDevAuthState(s.devAuthState);
    if (s.devMode) setUrl(DEV_TEST_URL);

    // 解析結果ストックの件数を読み込む
    const saved = getSavedAnalyses();
    setSavedAnalysisSlots(saved.length);

    // マイページからの復元チェック
    const restoreId = getPendingRestore();
    if (restoreId) {
      const target = saved.find((a) => a.id === restoreId);
      if (target) {
        setResults(target.data);
        setSelectedLevel(target.cefrLevel);
        setSourceUrl(target.sourceUrl);
        setInputMode(target.inputMode);
        if (target.sourceUrl && target.inputMode === "url") setUrl(target.sourceUrl);
        setActiveFilter("all");
        setAnalysisSaved(true);
      }
    }

    // 公開済み解析フィードを取得
    getRecentPublicAnalysesAction(6).then(setRecentPublicAnalyses);
  }, []);

  useEffect(() => {
    if (isSignedIn) return;
    if (hasCompletedOnboarding()) return;
    if (hasSavedSettings()) return;
    setShowOnboarding(true);
  }, [isSignedIn]);

  const handleOnboardingStart = useCallback(
    ({ level, accent }: { level: CefrLevel; accent: Accent }) => {
      saveSettings({ defaultLevel: level, accent });
      setSelectedLevel(level);
      markOnboardingCompleted();
      setShowOnboarding(false);
      toast.success("設定を保存しました");
    },
    []
  );

  useEffect(() => {
    return () => {
      if (urlTypingTimerRef.current !== null) {
        clearTimeout(urlTypingTimerRef.current);
      }
    };
  }, []);

  const clearUrlTypingTimer = useCallback(() => {
    if (urlTypingTimerRef.current !== null) {
      clearTimeout(urlTypingTimerRef.current);
      urlTypingTimerRef.current = null;
    }
    setIsUrlTyping(false);
  }, []);

  /** 推奨動画リストからランダムな URL をタイピング風に入力（解析は開始しない） */
  const fillRandomRecommendedUrl = useCallback(() => {
    clearUrlTypingTimer();
    const pool = getRecommendedVideoUrlCandidates();
    if (pool.length === 0) return;
    const target = pool[Math.floor(Math.random() * pool.length)]!;
    setError(null);
    setInputMode("url");
    setUrl("");
    setIsUrlTyping(true);
    let i = 0;
    const step = () => {
      i += 1;
      setUrl(target.slice(0, i));
      if (i < target.length) {
        const delay = 8 + Math.floor(Math.random() * 10);
        urlTypingTimerRef.current = setTimeout(step, delay);
      } else {
        setIsUrlTyping(false);
        setUrlInputGlow(true);
        urlTypingTimerRef.current = setTimeout(() => {
          setUrlInputGlow(false);
          urlTypingTimerRef.current = null;
        }, 480);
      }
    };
    urlTypingTimerRef.current = setTimeout(step, 40);
  }, [clearUrlTypingTimer]);

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
  const handleSubmit = useCallback(async () => {
    setError(null);
    setResults(null);
    setAllSaved(false);
    setFromCache(false);
    setActiveFilter("all");
    setAnalysisSaved(false);
    setPublicSaveUrl(null);
    setSourceUrl(inputMode === "url" ? url : undefined);

    // ── 解析クォータチェック（devModeはスキップ）──────────────────────────
    if (!devMode) {
      const quota = await consumeQuotaAction();
      if (!quota.allowed) {
        setShowQuotaModal(true);
        return;
      }
    }

    // キャッシュチェック（URLモードのみ・devModeはスキップ）
    if (inputMode === "url" && url.trim() && !devMode) {
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
      const result = await analyzeContent(inputValue, selectedLevel, inputMode, devMode);
      if (result.success) {
        setResults(result.data);
        // URLモードの結果をキャッシュ保存（devModeはスキップ）
        if (inputMode === "url" && url.trim() && !devMode) {
          setCachedResult(url.trim(), selectedLevel, result.data);
        }
        if (result.data.total_count === 0) {
          setError("抽出できる表現が見つかりませんでした。別のコンテンツをお試しください。");
        }
      } else {
        setError(result.error);
      }
    });
  }, [inputValue, url, selectedLevel, inputMode, devMode]);

  // Filtered results
  const filteredPhrases =
    results?.phrases.filter(
      (p) => activeFilter === "all" || p.type === activeFilter
    ) ?? [];

  // 全件を単語帳に保存
  const handleSaveAll = useCallback(() => {
    if (!results || allSaved) return;
    if (!isSignedIn) {
      openLoginPrompt("save");
      return;
    }
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
        example_translation: phrase.example_translation,
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

  // 解析結果全体をストックに保存
  const handleSaveAnalysis = useCallback(async () => {
    if (!results || analysisSaved || isSavingAnalysis) return;

    setIsSavingAnalysis(true);
    try {
      // クライアントの userId はロード遅延があり得るため、ログイン判定は isSignedIn のみ。
      // 実際の user 検証は saveAnalysisAction 内の auth() で行う。
      if (isSignedIn) {
        const result = await saveAnalysisAction({
          data: results,
          inputMode,
          cefrLevel: selectedLevel,
          sourceUrl,
        });
        if (result.success) {
          setAnalysisSaved(true);
          toast.success("解析結果を保存しました", {
            description: "マイページからいつでも復元できます",
          });
        } else {
          toast.error("解析結果を保存できませんでした", {
            description: result.error,
          });
        }
      } else {
        // 未ログイン → ログイン誘導（仕様: Guest は保存不可）
        openLoginPrompt("save");
      }
    } catch (e) {
      toast.error("保存中にエラーが発生しました", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setIsSavingAnalysis(false);
    }
  }, [
    results,
    analysisSaved,
    isSavingAnalysis,
    inputMode,
    selectedLevel,
    sourceUrl,
    isSignedIn,
  ]);

  // 管理者専用: SEO用公開ページとして保存
  const handleSavePublicAnalysis = useCallback(async () => {
    if (!results || isPublicSaving) return;
    setIsPublicSaving(true);
    const res = await savePublicAnalysis({
      data: results,
      cefrLevel: selectedLevel,
      sourceUrl,
      inputMode,
    });
    setIsPublicSaving(false);
    if (res.success) {
      setPublicSaveUrl(res.shareUrl);
      toast.success("公開ページを作成しました 🚀", {
        description: res.shareUrl,
        duration: 8000,
        action: {
          label: "開く",
          onClick: () => window.open(res.shareUrl, "_blank"),
        },
      });
    } else {
      toast.error("公開保存に失敗しました", { description: res.error });
    }
  }, [results, isPublicSaving, selectedLevel, sourceUrl, inputMode]);

  // AI記事生成 → そのまま解析
  const handleGenerateAndAnalyze = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    const genResult = await generateArticle(selectedLevel, getSettings().accent);

    if (!genResult.success) {
      setIsGenerating(false);
      setError(`記事の生成に失敗しました: ${genResult.error}`);
      return;
    }

    // タイトル + 本文をテキストエリアに注入
    const fullText = `${genResult.title}\n\n${genResult.body}`;
    setTextInput(fullText);
    setIsGenerating(false);

    // すぐに解析を開始（state更新を待たず直接 fullText を渡す）
    setResults(null);
    setAllSaved(false);
    setFromCache(false);
    setActiveFilter("all");
    setAnalysisSaved(false);
    setPublicSaveUrl(null);
    setSourceUrl(undefined);

    startTransition(async () => {
      const result = await analyzeContent(fullText, selectedLevel, "text", devMode);
      if (result.success) {
        setResults(result.data);
        if (result.data.total_count === 0) {
          setError("抽出できる表現が見つかりませんでした。別のコンテンツをお試しください。");
        }
      } else {
        setError(result.error);
      }
    });
  }, [selectedLevel, devMode]);

  // 個別保存（ScriptViewer / PhraseCard 共通）
  const handleSavePhrase = useCallback(
    (phrase: PhraseResult) => {
      if (!isSignedIn) {
        openLoginPrompt("save");
        return;
      }
      const key = phrase.expression.toLowerCase();
      if (savedExpressions.has(key)) return;
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
        sourceUrl,
      });
      if (result.success) {
        setSavedExpressions((s) => { const n = new Set(Array.from(s)); n.add(key); return n; });
        setDailyRemaining((r) => Math.max(0, r - 1));
        setVocabCount((c) => c + 1);
        if (isSignedIn) {
          void saveVocabularyAction({
            expression: phrase.expression,
            type: phrase.type,
            cefr_level: phrase.cefr_level,
            meaning_ja: phrase.meaning_ja,
            nuance: phrase.nuance,
            example: phrase.example,
            example_translation: phrase.example_translation,
            context: phrase.context,
            why_hard_for_japanese: phrase.why_hard_for_japanese,
            sourceUrl,
            status: 'learning',
          });
        }
        toast.success("単語帳に保存しました", {
          description: `「${phrase.expression}」をマイ単語帳に追加しました`,
        });
      } else if (result.reason === "limit_reached") {
        setShowPremium(true);
      }
    },
    [savedExpressions, sourceUrl, isSignedIn]
  );

  const canSubmit =
    inputMode === "url" ? url.trim().length > 0 : textInput.trim().length > 10;

  const hasContent = isPending || !!results || !!error;

  return (
    <div className="min-h-screen relative">
      {showPremium && <UpgradeModal reason="vocab_limit" onClose={() => setShowPremium(false)} />}
      {showQuotaModal && <UpgradeModal reason="daily_limit" onClose={() => setShowQuotaModal(false)} />}
      {showOnboarding && (
        <OnboardingModal
          initialLevel={"B1" as CefrLevel}
          initialAccent={"US"}
          onStart={handleOnboardingStart}
        />
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => {
            setShowSettings(false);
            const s = getSettings();
            setDevMode(s.devMode);
            setDevAuthState(s.devAuthState);
            if (s.devMode) setUrl(DEV_TEST_URL);
          }}
        />
      )}
      <SiteHeader
        maxWidth="5xl"
        left={
          <div className="flex items-center gap-2">
            <HeaderLogo />
            {devMode && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600 border border-amber-200">
                <span className="text-[10px] font-bold">🛠️ DEV</span>
                {devAuthState !== "real" && (
                  <span className="text-[9px] font-mono opacity-70">{devAuthState}</span>
                )}
              </span>
            )}
          </div>
        }
        right={
          <>
            <Link
              href="/articles"
              className="flex items-center gap-1 text-xs font-mono font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <Library className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Library</span>
            </Link>
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="設定"
            >
              <Settings className="h-4 w-4" />
            </button>
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
            {isSignedIn ? (
              <UserButton />
            ) : (
              <button
                onClick={() => openSignIn()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
              >
                Sign In
              </button>
            )}
          </>
        }
      />

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
            "font-black text-slate-900 tracking-tight mb-4",
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
          <div className="bg-white rounded-2xl border border-purple-200/50 shadow-sm p-6 sm:p-7">
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 mb-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1">
                    <label className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      YouTube / Web URL
                    </label>
                    <span
                      className="inline-flex w-fit max-w-full items-center rounded-md border border-slate-200/90 bg-slate-50 px-2 py-1 text-[9px] font-mono leading-tight text-slate-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]"
                      title="How it works"
                    >
                      URLを貼り付けるとAIが使える表現を抽出します ✨
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={fillRandomRecommendedUrl}
                    disabled={isPending || isUrlTyping}
                    className={cn(
                      "shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-mono font-medium transition-colors",
                      "border-violet-400 bg-violet-500 text-white",
                      "hover:bg-violet-600 hover:border-violet-500",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    title="Insert a random URL from the curated list (typing animation)"
                  >
                    {isUrlTyping ? "入力中…" : "💡 おすすめURLを入力"}
                  </button>
                </div>

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
                    readOnly={isUrlTyping}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... または記事URL"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-300 outline-none",
                      "placeholder:text-slate-400 text-slate-800",
                      "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50",
                      isUrlTyping && "cursor-wait bg-slate-50/80",
                      urlInputGlow &&
                        "ring-2 ring-indigo-300/50 shadow-[0_0_0_1px_rgba(129,140,248,0.25)] border-indigo-200/80",
                      urlType === "youtube"
                        ? "border-red-200 bg-red-50/40"
                        : urlType === "web"
                        ? "border-indigo-200 bg-indigo-50/30"
                        : "border-slate-200 bg-slate-50/50"
                    )}
                  />
                </div>
                <p className="mt-1.5 text-[9px] font-mono text-slate-400">
                  YouTubeは冒頭から（タイムスタンプ指定も可）、記事は全文から、学習に最適なパートをAIが自動抽出します。
                </p>
                {urlType && (
                  <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                    {urlType === "youtube" ? (
                      <>
                        <Youtube className="h-3 w-3 text-red-400 shrink-0" />
                        <span>字幕を取得して解析</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-3 w-3 text-indigo-400 shrink-0" />
                        <span>本文を抽出して解析</span>
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
                <div className="mt-3 flex flex-col items-start gap-1.5">
                  <button
                    onClick={handleGenerateAndAnalyze}
                    disabled={isGenerating || isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold shadow-sm hover:from-violet-600 hover:to-indigo-600 hover:shadow-[0_4px_18px_rgba(139,92,246,0.45)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        面白い記事を執筆中...✍️
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        AIに面白い記事を作ってもらう ✨
                      </>
                    )}
                  </button>
                  <p className="text-xs text-slate-400">
                    ※ あなたが選択したレベル（<span className="font-semibold text-indigo-500">{selectedLevel}</span>）に合わせて生成されます
                  </p>
                </div>
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
                          "text-base font-mono font-extrabold leading-none mb-0.5",
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
                  ? "bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-sm hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] active:scale-[0.99]"
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
                    className="bg-white rounded-2xl border border-violet-100/60 p-5 animate-pulse"
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

              <div className="flex items-center gap-2 flex-wrap">
                {/* Save analysis result */}
                <button
                  type="button"
                  onClick={() => void handleSaveAnalysis()}
                  disabled={analysisSaved || isSavingAnalysis}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                    analysisSaved
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 hover:shadow-sm hover:shadow-violet-100 disabled:opacity-70"
                  )}
                >
                  {analysisSaved ? (
                    <>
                      <Check className="h-4 w-4" />
                      結果を保存済み
                    </>
                  ) : isSavingAnalysis ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      この結果を保存
                    </>
                  )}
                </button>

                {/* 管理者専用: SEO公開保存ボタン */}
                {showPublicSaveButton && results && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSavePublicAnalysis}
                      disabled={isPublicSaving || !!publicSaveUrl}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                        publicSaveUrl
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      )}
                    >
                      {isPublicSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          保存中...
                        </>
                      ) : publicSaveUrl ? (
                        <>
                          <Check className="h-4 w-4" />
                          公開済み
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4" />
                          SEO用公開ページとして保存
                        </>
                      )}
                    </button>
                    {publicSaveUrl && (
                      <a
                        href={publicSaveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-2 rounded-xl text-xs text-indigo-600 hover:bg-indigo-50 border border-indigo-100 transition-colors"
                        title={publicSaveUrl}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* 一括保存はプレミアムのみ（無料は1日の保存上限が少ないため） */}
                {isPro ? (
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={allSaved}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                      allSaved
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm hover:shadow-indigo-100"
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
                ) : (
                  <div className="flex flex-col items-end sm:items-start gap-1 max-w-[220px] text-right sm:text-left">
                    <p className="text-[10px] leading-snug text-slate-400 font-mono">
                      一括保存はプレミアムのみ
                    </p>
                    <p className="text-[9px] leading-relaxed text-slate-400">
                      無料プランは1日あたりの保存上限が小さいため、カードから個別に保存してください。
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPremium(true)}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
                    >
                      プレミアムを見る
                    </button>
                  </div>
                )}
              </div>
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
                showTranslate={inputMode === "url"}
                isPro={isPro}
                dailyRemaining={dailyRemaining}
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
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-700 hover:shadow-sm"
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

      {/* ── Recommended Carousel（コンテンツなし時のみ） ── */}
      {!hasContent && <RecommendedCarousel />}

      {/* ── Latest Articles Carousel（コンテンツなし時のみ） ── */}
      {!hasContent && <LatestArticlesCarousel />}

      {/* ── Newsletter（コンテンツなし時のみ） ── */}
      {!hasContent && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
          <NewsletterBanner />
        </div>
      )}

      {/* ── Recent Public Parses（コンテンツなし時のみ） ── */}
      {!hasContent && recentPublicAnalyses.length > 0 && (
        <section className="bg-slate-950 py-10 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-5">
              みんなの最新の解析{" "}
              <span className="text-slate-600">/ Recent Public Parses</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentPublicAnalyses.map((item) => (
                <a
                  key={item.id}
                  href={`/share/${item.id}`}
                  className="group block bg-slate-900 border border-slate-700/50 hover:border-indigo-500/60 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border",
                        {
                          "bg-slate-800 text-slate-400 border-slate-700": item.level === "A1",
                          "bg-green-950 text-green-400 border-green-900": item.level === "A2",
                          "bg-blue-950 text-blue-400 border-blue-900": item.level === "B1",
                          "bg-indigo-950 text-indigo-400 border-indigo-900": item.level === "B2",
                          "bg-purple-950 text-purple-400 border-purple-900": item.level === "C1",
                          "bg-rose-950 text-rose-400 border-rose-900": item.level === "C2",
                        }
                      )}
                    >
                      {item.level}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-auto font-mono">
                      {new Date(item.createdAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {item.title && (
                    <p className="text-slate-200 font-mono text-xs font-medium truncate mb-2 leading-snug">
                      {item.title}
                    </p>
                  )}

                  <div className="space-y-0.5 mb-3">
                    {item.phrases.slice(0, 2).map((phrase, i) => (
                      <p key={i} className="text-indigo-400 font-mono text-xs truncate">
                        {phrase.expression}
                      </p>
                    ))}
                    {item.phrases.length > 2 && (
                      <p className="text-slate-600 font-mono text-xs">
                        +{item.phrases.length - 2} more
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end">
                    <span className="text-[10px] font-mono text-slate-600 group-hover:text-indigo-400 transition-colors">
                      →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      {!hasContent && <SiteFooter />}
    </div>
  );
}
