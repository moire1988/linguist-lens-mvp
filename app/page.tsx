"use client";

import {
  useState,
  useTransition,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Youtube,
  Globe,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
  ChevronRight,
  Tv,
  BookMarked,
  Wand2,
  GraduationCap,
} from "lucide-react";
import { useAuth, useClerk, UserButton } from "@clerk/nextjs";
import { useEffectiveAuth } from "@/lib/dev-auth";
import {
  saveAnalysisAction,
  findExistingAnalysisIdAction,
} from "@/app/actions/save-analysis";
import {
  consumeQuotaAction,
  getUserAnalysisCountAction,
} from "@/app/actions/check-quota";
import { FREE_ANALYSIS_LIMIT } from "@/lib/quota-config";
import type { AnalysisCountInfo } from "@/lib/quota-types";
import { UpgradeModal } from "@/components/upgrade-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AnalysisResult, AnalyzeErrorCode } from "@/lib/types";
import { callAnalyzeApi } from "@/lib/analyze-client";
import { isAnalyzeDebugMagicUrlInput } from "@/lib/analyze-debug-magic";
import { generateArticle } from "@/app/actions/generate-article";
import { getVocabularyCount } from "@/lib/vocabulary";
import { getVocabularyCountAction } from "@/app/actions/vocabulary";
import { getCachedEntry, setCachedResult } from "@/lib/cache";
import { OnboardingModal } from "@/components/onboarding-modal";
import { NewsletterBanner } from "@/components/newsletter-banner";
import { RecommendedCarousel } from "@/components/recommended-carousel";
import { LatestArticlesCarousel } from "@/components/latest-articles-carousel";
import { CommunityAnalysesCarousel } from "@/components/community-analyses-carousel";
import { FavoriteFakeDoorButton } from "@/components/favorite-fake-door-button";
import { SiteHeader } from "@/components/site-header";
import { NavMenu } from "@/components/nav-menu";
import {
  getSettings,
  saveSettings,
  DEV_TEST_URL,
  hasCompletedOnboarding,
  hasSavedSettings,
  markOnboardingCompleted,
  type CefrLevel,
  type Accent,
} from "@/lib/settings";
import {
  getRecentPublicAnalysesAction,
  getFeaturedAnalysesAction,
} from "@/app/actions/public-analyses";
import type { FeaturedAnalysis, RecentPublicAnalysis } from "@/lib/public-analyses-types";
import {
  RECOMMENDED_VIDEOS,
  getRecommendedVideoTargetPathByUrl,
} from "@/lib/recommended-videos-data";
import { PhraseOfTheDay } from "@/components/phrase-of-the-day";

// ─── Constants ─────────────────────────────────────────────────────────────

const CEFR_LEVELS = [
  { value: "A1", label: "A1", description: "入門",   toeic: "〜225",      toefl: null,      color: "slate"  },
  { value: "A2", label: "A2", description: "初級",   toeic: "225〜549",   toefl: null,      color: "green"  },
  { value: "B1", label: "B1", description: "中級",   toeic: "550〜780",   toefl: "42〜71",  color: "blue"   },
  { value: "B2", label: "B2", description: "中上級", toeic: "785〜940",   toefl: "72〜94",  color: "indigo" },
  { value: "C1", label: "C1", description: "上級",   toeic: "945〜990",   toefl: "95〜120", color: "purple" },
  { value: "C2", label: "C2", description: "熟達",   toeic: null,         toefl: null,      color: "rose"   },
];

/** 送信ボタン内プログレス：約60秒で99%まで（完了時はリセット） */
const SUBMIT_PROGRESS_MS = 60_000;

/** トップ：文法特集（無料）へのミニマル導線 */
function GrammarFeatureBanner() {
  return (
    <div className="mt-4 mb-2 max-w-2xl mx-auto px-0">
      <Link
        href="/library/grammar"
        className={cn(
          "group flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white/60 backdrop-blur-sm",
          "px-4 py-3.5 sm:px-5 sm:py-4 hover:border-violet-200/90 hover:shadow-sm transition-all",
          "border-l-[3px] border-l-violet-500/60"
        )}
      >
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200/80 bg-slate-50/80 text-violet-600 group-hover:border-violet-200 group-hover:bg-violet-50/50 transition-colors">
          <GraduationCap className="w-5 h-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              文法コアイメージ特集
            </p>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 text-emerald-700">
              無料
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-snug">
            「ing と to」「前置詞」など、コアイメージで徹底解説
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" aria-hidden />
      </Link>
    </div>
  );
}

const SUBMIT_LOAD_LABELS_URL = [
  "動画を取得中...",
  "AIが表現を抽出中...",
  "マイページを準備中...",
  "結果を保存中...",
];

const SUBMIT_LOAD_LABELS_TEXT = [
  "テキストを読み込み中...",
  "AIが表現を抽出中...",
  "マイページを準備中...",
  "結果を保存中...",
];

/** おすすめURLフェイク解析の待機時間（ms） */
const RECOMMENDED_FAKE_LOAD_MS = 3500;

/** `recommended-videos-data` から YouTube 視聴 URL の候補を生成 */
function getRecommendedVideoUrlCandidates(): string[] {
  return RECOMMENDED_VIDEOS.filter((v) => v.youtubeId.trim().length > 0).map(
    (v) => `https://www.youtube.com/watch?v=${v.youtubeId.trim()}`
  );
}

/** ゲスト解析 UUID を localStorage に保存（後からアクセス用） */
function storeGuestAnalysisId(id: string): void {
  if (typeof window === "undefined") return;
  const key = "ll_guest_analysis_ids";
  const existing: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");
  const updated = [id, ...existing.filter((i) => i !== id)].slice(0, 20);
  localStorage.setItem(key, JSON.stringify(updated));
}

// ─── Page Component ────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();

  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("B2");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AnalyzeErrorCode | null>(null);
  /** 送信ボタン内の擬似進捗（0–99、完了でリセット） */
  const [submitProgress, setSubmitProgress] = useState(0);
  const [vocabCount, setVocabCount] = useState(0);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [analysisQuota, setAnalysisQuota] = useState<AnalysisCountInfo | null>(null);
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  useEffectiveAuth(); // devAuthState を副作用で読み込む（将来的な機能フラグ用）
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [devMode, setDevMode] = useState(false);
  /** 解析エラーの errorCode とサーバー文言を表示（next dev では開発者モードOFFでも可） */
  const showAnalyzeErrorDebug =
    process.env.NODE_ENV === "development" || devMode;
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentPublicAnalyses, setRecentPublicAnalyses] = useState<RecentPublicAnalysis[]>([]);
  const [featuredAnalyses, setFeaturedAnalyses] = useState<FeaturedAnalysis[]>([]);
  const [urlInputGlow, setUrlInputGlow] = useState(false);
  const [isUrlTyping, setIsUrlTyping] = useState(false);
  const urlTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 設定・マイページ保存件数をロード（ログイン時は Supabase）
  useEffect(() => {
    const s = getSettings();
    setSelectedLevel(s.defaultLevel);
    setDevMode(s.devMode);
    if (s.devMode) setUrl(DEV_TEST_URL);

    // 公開済み解析フィードを取得
    getRecentPublicAnalysesAction(6).then(setRecentPublicAnalyses);
    getFeaturedAnalysesAction(6).then(setFeaturedAnalyses);
  }, []);

  useEffect(() => {
    if (isSignedIn === undefined) return;
    if (!isSignedIn) {
      setVocabCount(getVocabularyCount());
      return;
    }
    void getVocabularyCountAction().then(setVocabCount);
  }, [isSignedIn]);

  useEffect(() => {
    // Clerk がまだ認証状態を読み込み中（undefined）は何もしない
    if (isSignedIn === undefined) return;
    // ログイン済みならオンボーディング不要。万が一表示中の場合は閉じる
    if (isSignedIn) {
      setShowOnboarding(false);
      // ログイン済みの場合は解析利用状況を取得
      getUserAnalysisCountAction().then(setAnalysisQuota);
      return;
    }
    // 未ログインの場合のみ、オンボーディング完了 or 設定済みを確認してから表示
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
      toast?.success?.("設定を保存しました");
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
  /** API〜保存〜遷移まで（useTransition の isPending だけでは非同期中に落ちるため併用） */
  const [isLoading, setIsLoading] = useState(false);
  const analysisBusy = isPending || isLoading;

  // Detect URL type
  const inputValue = inputMode === "url" ? url : textInput;
  const urlType =
    url.includes("youtube.com") || url.includes("youtu.be")
      ? "youtube"
      : url.startsWith("http")
      ? "web"
      : null;

  useEffect(() => {
    if (!analysisBusy) {
      setSubmitProgress(0);
      return;
    }
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.min(99, Math.floor((elapsed / SUBMIT_PROGRESS_MS) * 100));
      setSubmitProgress(pct);
    }, 120);
    return () => window.clearInterval(id);
  }, [analysisBusy]);

  const submitLoadLabel = useMemo(() => {
    if (!analysisBusy) return "";
    const labels =
      inputMode === "url" ? SUBMIT_LOAD_LABELS_URL : SUBMIT_LOAD_LABELS_TEXT;
    const idx = Math.min(labels.length - 1, Math.floor(submitProgress / 25));
    return labels[idx] ?? labels[0];
  }, [analysisBusy, inputMode, submitProgress]);

  /** 解析完了後、DB に保存して /analyses/[id] へ遷移 */
  const saveAndRedirect = useCallback(
    async (
      data: AnalysisResult,
      opts: { inputMode: "url" | "text"; cefrLevel: string; sourceUrl?: string }
    ) => {
      try {
        const result = await saveAnalysisAction({
          data,
          inputMode: opts.inputMode,
          cefrLevel: opts.cefrLevel,
          sourceUrl: opts.sourceUrl,
        });

        // result 自体が undefined/null の場合の安全なチェック
        if (!result || result.success !== true) {
          const errText =
            result && "error" in result
              ? result.error
              : "保存に失敗しました（サーバーからの応答がありません）";
          if (process.env.NODE_ENV === "development") {
            console.error("[saveAndRedirect] saveAnalysisAction failed", result);
          }
          setError(`保存に失敗しました: ${errText}`);
          setErrorCode("generic");
          return;
        }

        // 成功時の処理
        if (result.id) {
          storeGuestAnalysisId(result.id);
          if (opts.inputMode === "url" && opts.sourceUrl?.trim()) {
            setCachedResult(
              opts.sourceUrl.trim(),
              opts.cefrLevel,
              data,
              result.id
            );
          }
          router.push(`/analyses/${result.id}`);
        } else {
          throw new Error("保存は成功しましたが、IDが返却されませんでした。");
        }
      } catch (err: unknown) {
        console.error("[saveAndRedirect] Exception:", err);
        const msg = err instanceof Error ? err.message : "不明なエラー";
        setError(`通信エラーが発生しました: ${msg}`);
        setErrorCode("generic");
      }
    },
    [router]
  );

  // URL/テキスト解析を実行
  const handleSubmit = useCallback(async () => {
    setError(null);
    setErrorCode(null);
    setSubmitProgress(0);

    const devMagicAnalyzeUrl =
      process.env.NODE_ENV === "development" &&
      inputMode === "url" &&
      isAnalyzeDebugMagicUrlInput(url);

    // ── おすすめURL（RECOMMENDED_VIDEOS と同一動画）→ API なし・演出後に既存ページへ
    if (inputMode === "url" && url.trim()) {
      const fakeTarget = getRecommendedVideoTargetPathByUrl(url.trim());
      if (fakeTarget) {
        setIsLoading(true);
        try {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, RECOMMENDED_FAKE_LOAD_MS);
          });
          router.push(fakeTarget);
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }

    // ── DB 既存行（同一 video_id × 同一レベル）→ 外部API・解析を呼ばず遷移（ゲストより先に実行） ──
    // DEV 魔法URLはサーバー側のデバッグ分岐と揃え、ここではスキップ
    if (
      inputMode === "url" &&
      url.trim() &&
      !devMode &&
      !devMagicAnalyzeUrl
    ) {
      try {
        const existingId = await findExistingAnalysisIdAction(
          url.trim(),
          selectedLevel
        );
        if (existingId) {
          toast.success("✨ 過去の解析ページを再表示します（同一動画・同一レベル）");
          storeGuestAnalysisId(existingId);
          router.push(`/analyses/${existingId}`);
          return;
        }
      } catch (err: unknown) {
        if (process.env.NODE_ENV === "development") {
          console.error("[handleSubmit] findExistingAnalysisIdAction", err);
        }
      }

      // ── ローカル7日キャッシュ（保存済み ID があれば INSERT せずそのページへ） ──
      const cacheEntry = getCachedEntry(url.trim(), selectedLevel);
      if (cacheEntry?.data) {
        if (cacheEntry.analysisId) {
          toast.success("キャッシュから読み込みました", {
            description: "保存済みの解析ページへ移動します（7日間有効）",
          });
          storeGuestAnalysisId(cacheEntry.analysisId);
          router.push(`/analyses/${cacheEntry.analysisId}`);
          return;
        }
        toast.success("キャッシュから読み込みました", {
          description: "解析結果を保存しています…（7日間有効）",
        });
        setIsLoading(true);
        try {
          await saveAndRedirect(cacheEntry.data, {
            inputMode,
            cefrLevel: selectedLevel,
            sourceUrl: url,
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }

    // ── Guest: ログインを促す（DBキャッシュ・ローカルキャッシュのあと。devMode・DEV魔法URLはスキップ）
    if (!isSignedIn && !devMode && !devMagicAnalyzeUrl) {
      openSignIn();
      return;
    }

    // ── クォータチェック（devMode・DEV魔法URLはスキップ）──────────────────
    if (!devMode && !devMagicAnalyzeUrl) {
      const quota = await consumeQuotaAction();
      if (!quota?.allowed) {
        setShowQuotaModal(true);
        return;
      }
    }

    setIsLoading(true);
    startTransition(() => {
      void (async () => {
        try {
          const result = await callAnalyzeApi(
            inputValue,
            selectedLevel,
            inputMode,
            devMode
          );

          // 修正ポイント: result が falsy (undefined/null) の場合はここで確実に止める
          if (!result) {
            setError("サーバーからの応答がありません。時間をおいて再試行してください。");
            setErrorCode("generic");
            return;
          }

          // この時点で result は存在するので、安全に success をチェックできる
          if (result.success !== true) {
            if (process.env.NODE_ENV === "development") {
              console.warn("[analyze] error", result.errorCode, result.error);
            }
            if (result.errorCode === "inappropriate_content") {
              toast.error(
                "不適切なコンテンツが含まれているため解析できませんでした。"
              );
            }
            setError(result.error ?? "解析に失敗しました");
            setErrorCode(result.errorCode ?? "generic");
            return;
          }

          if ("existingAnalysisId" in result && result.existingAnalysisId) {
            toast.success("✨ 既存の解析結果を利用します（同一動画・同一レベル）");
            storeGuestAnalysisId(result.existingAnalysisId);
            router.push(`/analyses/${result.existingAnalysisId}`);
            return;
          }

          if (!("data" in result) || !result.data) {
            setError("解析データがありません。もう一度お試しください。");
            setErrorCode("generic");
            return;
          }

          const analysisData = result.data;
          const totalCount = analysisData.total_count;
          if (typeof totalCount !== "number" || !Number.isFinite(totalCount)) {
            setError("解析結果の形式が不正です。もう一度お試しください。");
            setErrorCode("generic");
            return;
          }

          if (totalCount === 0) {
            setError(
              "抽出できる表現が見つかりませんでした。別のコンテンツをお試しください。"
            );
            setErrorCode("generic");
            return;
          }

          await saveAndRedirect(analysisData, {
            inputMode,
            cefrLevel: selectedLevel,
            sourceUrl: inputMode === "url" ? url : undefined,
          });
        } catch (err: unknown) {
          // 何らかの例外が発生した場合（APIのネットワークエラーなど）
          console.error("[handleSubmit] Exception during analysis:", err);
          const msg = err instanceof Error ? err.message : "不明なエラー";
          setError(`予期せぬエラーが発生しました: ${msg}`);
          setErrorCode("generic");
        } finally {
          setIsLoading(false);
        }
      })();
    });
  }, [
    inputValue,
    url,
    selectedLevel,
    inputMode,
    devMode,
    isSignedIn,
    openSignIn,
    router,
    saveAndRedirect,
  ]);

  // AI記事生成 → そのまま解析
  const handleGenerateAndAnalyze = useCallback(async () => {
    setError(null);
    setErrorCode(null);
    setSubmitProgress(0);

    // Guest: ログインを促す（devModeはスキップ）
    if (!isSignedIn && !devMode) {
      openSignIn();
      return;
    }

    // クォータチェック（devModeはスキップ）
    if (!devMode) {
      const quota = await consumeQuotaAction();
      if (!quota || !quota.allowed) {
        // 安全にチェック
        setShowQuotaModal(true);
        return;
      }
    }

    setIsGenerating(true);

    let genResult: Awaited<ReturnType<typeof generateArticle>> | undefined;
    try {
      genResult = await generateArticle(selectedLevel, getSettings().accent);
    } catch (err: unknown) {
      console.error("[handleGenerateAndAnalyze] Exception:", err);
      setError(
        `記事の生成に失敗しました: ${err instanceof Error ? err.message : "通信エラー"}`
      );
      setErrorCode("generic");
      setIsGenerating(false);
      return;
    }

    setIsGenerating(false);

    // 修正ポイント: genResult が無い場合を確実に弾く
    if (!genResult) {
      setError("サーバーからの応答がありません。時間をおいて再試行してください。");
      setErrorCode("generic");
      return;
    }

    if (genResult.success !== true) {
      const errMsg =
        "error" in genResult && genResult.error ? genResult.error : "不明なエラー";
      setError(`記事の生成に失敗しました: ${errMsg}`);
      setErrorCode("generic");
      return;
    }

    // 成功した場合のみ title と body が存在する
    if (
      !("title" in genResult) ||
      !("body" in genResult) ||
      !genResult.title ||
      !genResult.body
    ) {
      setError("記事の生成結果が不正です。もう一度お試しください。");
      setErrorCode("generic");
      return;
    }

    const fullText = `${genResult.title}\n\n${genResult.body}`;
    setTextInput(fullText);

    setIsLoading(true);
    startTransition(() => {
      void (async () => {
        try {
          const result = await callAnalyzeApi(
            fullText,
            selectedLevel,
            "text",
            devMode
          );

          // 修正ポイント: result が falsy な場合の安全網
          if (!result) {
            setError("サーバーからの応答がありません。時間をおいて再試行してください。");
            setErrorCode("generic");
            return;
          }

          if (result.success !== true) {
            if (process.env.NODE_ENV === "development") {
              console.warn("[analyze] error", result.errorCode, result.error);
            }
            if (result.errorCode === "inappropriate_content") {
              toast.error(
                "不適切なコンテンツが含まれているため解析できませんでした。"
              );
            }
            setError(result.error ?? "解析に失敗しました");
            setErrorCode(result.errorCode ?? "generic");
            return;
          }

          if ("existingAnalysisId" in result && result.existingAnalysisId) {
            storeGuestAnalysisId(result.existingAnalysisId);
            router.push(`/analyses/${result.existingAnalysisId}`);
            return;
          }

          if (!("data" in result) || !result.data) {
            setError("解析データがありません。もう一度お試しください。");
            setErrorCode("generic");
            return;
          }

          const analysisData = result.data;
          const totalCount = analysisData.total_count;
          if (typeof totalCount !== "number" || !Number.isFinite(totalCount)) {
            setError("解析結果の形式が不正です。もう一度お試しください。");
            setErrorCode("generic");
            return;
          }

          if (totalCount === 0) {
            setError(
              "抽出できる表現が見つかりませんでした。別のコンテンツをお試しください。"
            );
            setErrorCode("generic");
            return;
          }

          await saveAndRedirect(analysisData, {
            inputMode: "text",
            cefrLevel: selectedLevel,
            sourceUrl: undefined,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "不明なエラー";
          setError(`予期せぬエラーが発生しました: ${msg}`);
          setErrorCode("generic");
        } finally {
          setIsLoading(false);
        }
      })();
    });
  }, [selectedLevel, devMode, isSignedIn, openSignIn, saveAndRedirect]);

  const canSubmit =
    inputMode === "url" ? url.trim().length > 0 : textInput.trim().length > 10;

  const hasContent = analysisBusy || !!error;

  return (
    <div className="min-h-screen relative">
      {showQuotaModal && <UpgradeModal reason="analysis_limit" onClose={() => setShowQuotaModal(false)} />}
      {showOnboarding && (
        <OnboardingModal
          initialLevel={"B1" as CefrLevel}
          initialAccent={"US"}
          onStart={handleOnboardingStart}
        />
      )}
      <SiteHeader
        maxWidth="5xl"
        right={
          <>
            {/* マイページ */}
            <Link
              href="/mypage"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-100 transition-colors"
            >
              <BookMarked className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">マイページ</span>
              {vocabCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {vocabCount}
                </span>
              )}
            </Link>

            {/* ナビゲーションメニュー */}
            <NavMenu vocabCount={vocabCount} />

            {/* 認証 */}
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
              お気に入りの動画から、生きた英語を自分のものに。
            </span>
          </div>
          <h1 className={cn(
            "font-black text-slate-900 tracking-tight mb-4 leading-[1.45]",
            hasContent
              ? "text-2xl sm:text-3xl"
              : "text-3xl sm:text-[2.75rem]"
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
            (analysisBusy || error) && "mb-10"
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
                    disabled={analysisBusy || isUrlTyping}
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
                      /* 視線誘導: 非フォーカスでもうっすら紫〜青の発光 */
                      "shadow-[0_0_15px_rgba(165,180,252,0.3)] ring-2 ring-indigo-50/50",
                      /* フォーカス時はリングとシャドウを一段強く（shadow-indigo-200 は任意値で近似） */
                      "focus:border-indigo-400 focus:ring-indigo-200 focus:ring-2",
                      "focus:shadow-[0_0_22px_rgba(199,210,254,0.55)]",
                      isUrlTyping && "cursor-wait bg-slate-50/80",
                      urlInputGlow &&
                        "ring-indigo-300/60 ring-2 shadow-[0_0_20px_rgba(165,180,252,0.45)] border-indigo-200/80",
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
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50 outline-none resize-none leading-relaxed",
                    "transition-all duration-300",
                    "shadow-[0_0_15px_rgba(165,180,252,0.3)] ring-2 ring-indigo-50/50",
                    "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200",
                    "focus:shadow-[0_0_22px_rgba(199,210,254,0.55)]"
                  )}
                />
                <p className="mt-1.5 text-xs text-slate-400 text-right">
                  {textInput.length} 文字
                </p>
                <div className="mt-3 flex flex-col items-start gap-1.5">
                  <button
                    onClick={handleGenerateAndAnalyze}
                    disabled={isGenerating || analysisBusy}
                    className={[
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all overflow-hidden",
                      isGenerating
                        ? "bg-gradient-to-r from-violet-500 to-indigo-500 opacity-90 cursor-not-allowed animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                        : analysisBusy
                        ? "bg-gradient-to-r from-violet-400 to-indigo-400 opacity-60 cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-500 to-indigo-500 shadow-sm hover:from-violet-600 hover:to-indigo-600 hover:shadow-[0_4px_18px_rgba(139,92,246,0.45)] active:scale-[0.98]",
                    ].join(" ")}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                        AIが面白い記事を執筆中... ✨
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 flex-shrink-0" />
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
                          "text-sm font-bold font-mono leading-none mb-1",
                          isSelected ? "text-indigo-600" : "text-slate-700"
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
                const level = CEFR_LEVELS.find((l) => l.value === selectedLevel)!;
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

            {/* Submit button（ローディングはボタン内で完結） */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || analysisBusy}
              aria-busy={analysisBusy}
              aria-label={
                analysisBusy ? "解析を実行しています" : "AIで表現を抽出する"
              }
              className={cn(
                "w-full rounded-xl transition-all",
                "min-h-[3.25rem] min-w-[18rem] sm:min-w-[22rem] mx-auto",
                "font-semibold text-sm",
                analysisBusy && "cursor-wait bg-transparent p-0 shadow-none ring-0",
                !analysisBusy &&
                  canSubmit &&
                  "bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-sm hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] active:scale-[0.99]",
                !analysisBusy &&
                  !canSubmit &&
                  "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {analysisBusy ? (
                <span className="flex w-full items-center gap-2.5 py-3.5 px-4 sm:px-5 text-white bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl">
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin text-white/95"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 text-center text-[13px] sm:text-sm font-medium leading-tight truncate">
                    {submitLoadLabel}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs font-mono text-white/90 w-[2.5rem] text-right">
                    {submitProgress}%
                  </span>
                </span>
              ) : (
                <span className="flex w-full items-center justify-center gap-2 py-3.5 px-6">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-center">AIで表現を抽出する</span>
                  {canSubmit && (
                    <ChevronRight className="h-4 w-4 shrink-0 ml-auto" />
                  )}
                </span>
              )}
            </button>

            {/* 解析残り回数インジケーター（Free会員のみ） */}
            {isSignedIn && analysisQuota && !analysisQuota.isUnlimited && (
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {Array.from({ length: analysisQuota.limit }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 w-6 rounded-full transition-colors",
                      i < analysisQuota.used ? "bg-slate-200" : "bg-indigo-400"
                    )}
                  />
                ))}
                <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                  残り{Math.max(0, analysisQuota.limit - analysisQuota.used)}/{analysisQuota.limit}回
                </span>
              </div>
            )}
          </div>
        </div>
        {/* ── Error ── */}
        {error && !analysisBusy && (() => {
          const isNoSubs  = errorCode === "no_subtitles";
          const isInvalid = errorCode === "invalid_url";
          const isBlocked = errorCode === "inappropriate_content";
          const isAiParse = errorCode === "ai_parse_error";

          const icon = isNoSubs ? (
            <span className="text-2xl leading-none select-none">🥲</span>
          ) : isInvalid ? (
            <span className="text-2xl leading-none select-none">👀</span>
          ) : isBlocked ? (
            <span className="text-2xl leading-none select-none">🛡️</span>
          ) : isAiParse ? (
            <span className="text-2xl leading-none select-none">🤖</span>
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-400" />
          );

          const title = isNoSubs
            ? "英語字幕が見つかりませんでした"
            : isInvalid
            ? "URLを確認してください"
            : isBlocked
            ? "解析できませんでした"
            : isAiParse
            ? "AIの応答を解釈できませんでした"
            : "解析エラーが発生しました";

          const body = isNoSubs
            ? "申し訳ありません、この動画には英語字幕が設定されていないようです🥲 別の動画でお試しください！"
            : isInvalid
            ? "URLの形式が正しくないようです。YouTubeや英語記事のURLを確認してください👀"
            : isBlocked
            ? "不適切なコンテンツが含まれているため解析できませんでした。"
            : isAiParse
            ? "一時的な通信やAIの出力形式のずれの可能性があります。しばらくしてからもう一度お試しください。"
            : "解析中にエラーが発生しました。少し時間をおいて再度お試しください🙏";

          const borderColor = isNoSubs
            ? "border-amber-200/70"
            : isInvalid
            ? "border-sky-200/70"
            : isBlocked
            ? "border-violet-200/70"
            : isAiParse
            ? "border-orange-200/70"
            : "border-rose-200/70";

          const bgColor = isNoSubs
            ? "bg-amber-50/80"
            : isInvalid
            ? "bg-sky-50/80"
            : isBlocked
            ? "bg-violet-50/80"
            : isAiParse
            ? "bg-orange-50/80"
            : "bg-rose-50/80";

          const titleColor = isNoSubs
            ? "text-amber-800"
            : isInvalid
            ? "text-sky-800"
            : isBlocked
            ? "text-violet-900"
            : isAiParse
            ? "text-orange-900"
            : "text-rose-800";

          const bodyColor = isNoSubs
            ? "text-amber-700"
            : isInvalid
            ? "text-sky-700"
            : isBlocked
            ? "text-violet-800"
            : isAiParse
            ? "text-orange-800"
            : "text-rose-600";

          return (
            <div className="max-w-2xl mx-auto mt-6">
              <div className={`flex gap-3.5 items-start rounded-2xl border px-5 py-4 backdrop-blur-sm ${bgColor} ${borderColor}`}>
                <div className="flex-shrink-0 mt-0.5">{icon}</div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold mb-0.5 ${titleColor}`}>
                    {title}
                  </p>
                  <p className={`text-sm leading-relaxed ${bodyColor}`}>
                    {body}
                  </p>
                  {showAnalyzeErrorDebug && errorCode && (
                    <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white/80 px-3 py-2.5">
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        {process.env.NODE_ENV === "development"
                          ? "Dev · next dev では開発者モードOFFでも表示"
                          : "Dev · 検証用（設定の開発者モードON）"}
                      </p>
                      <p className="text-xs font-mono text-slate-700 break-all leading-relaxed">
                        <span className="text-indigo-600 font-semibold">[{errorCode}]</span>
                        <span className="text-slate-500"> </span>
                        {error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── 今日のフレーズ（URL入力セクション直下・人気動画カルーセル直前） ── */}
        <div className="mt-10 mb-2 max-w-2xl mx-auto">
          <PhraseOfTheDay />
          <GrammarFeatureBanner />
        </div>
      </main>

      {/* ── Recommended Carousel（コンテンツなし時のみ） ── */}
      {!hasContent && <RecommendedCarousel />}

      {/* ── みんなの最新の解析（Examples 同様の横スクロールカルーセル） ── */}
      {!hasContent && recentPublicAnalyses.length > 0 && (
        <CommunityAnalysesCarousel items={recentPublicAnalyses} />
      )}

      {/* ── Latest Articles Carousel（コンテンツなし時のみ） ── */}
      {!hasContent && <LatestArticlesCarousel />}

      {/* ── Newsletter（コンテンツなし時のみ） ── */}
      {!hasContent && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
          <NewsletterBanner />
        </div>
      )}

      {/* ── 注目の解析記事（is_featured=true・コンテンツなし時のみ） ── */}
      {!hasContent && featuredAnalyses.length > 0 && (
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
                ✦ Featured
              </p>
              <h2 className="text-sm font-semibold text-slate-700">
                注目の解析記事
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredAnalyses.map((item) => {
                const ytId =
                  item.url?.match(/[?&]v=([^&]{11})/)?.[1] ??
                  item.url?.match(/youtu\.be\/([^?&]{11})/)?.[1];
                const isYt = !!ytId;

                const cefrBg: Record<string, string> = {
                  A1: "bg-slate-100 text-slate-600",
                  A2: "bg-green-100 text-green-700",
                  B1: "bg-blue-100 text-blue-700",
                  B2: "bg-indigo-100 text-indigo-700",
                  C1: "bg-purple-100 text-purple-700",
                  C2: "bg-rose-100 text-rose-700",
                };

                return (
                  <div key={item.id} className="relative">
                  <a
                    href={`/analyses/${item.id}`}
                    className="group flex flex-col bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Thumbnail */}
                    {ytId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                        alt="thumbnail"
                        className="w-full h-36 object-cover"
                      />
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                        <span className="text-3xl opacity-40">📄</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-4">
                      {/* Meta row */}
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={cn(
                            "text-[10px] font-bold font-mono px-2 py-0.5 rounded-full",
                            cefrBg[item.level] ?? "bg-slate-100 text-slate-600"
                          )}
                        >
                          {item.level}
                        </span>
                        {isYt && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Youtube className="h-2.5 w-2.5 text-red-400" />
                            YouTube
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-slate-400">
                          {item.phraseCount}個の表現
                        </span>
                      </div>

                      {/* Expression previews */}
                      <div className="flex-1 space-y-1 mb-3">
                        {item.phrases.map((phrase, i) => (
                          <p
                            key={i}
                            className="text-xs font-semibold text-slate-700 truncate"
                          >
                            · {phrase.expression}
                          </p>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-0.5 transition-colors">
                          詳しく見る
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                  <div className="absolute right-2 top-2 z-10">
                    <FavoriteFakeDoorButton />
                  </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
