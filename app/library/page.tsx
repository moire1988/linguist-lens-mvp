"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
  useSyncExternalStore,
} from "react";
import { useWindowVirtualizer, measureElement } from "@tanstack/react-virtual";
import {
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Check,
  AlertTriangle,
  X,
  Lightbulb,
  Zap,
  Shuffle,
  Search,
  Volume2,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import type { ExpressionType } from "@/lib/types";
import { savePhrase, getVocabulary } from "@/lib/vocabulary";
import {
  saveVocabularyAction,
  listSavedExpressionKeysAction,
} from "@/app/actions/vocabulary";
import { getSettings } from "@/lib/settings";
import { useAccentLang } from "@/hooks/use-accent-lang";
import { isSpeechSynthesisSupported, speakEnglish } from "@/lib/speech";
import {
  isLibraryPremiumAccess,
  getStripeStatusFromUserPublicMetadata,
  LIBRARY_PREMIUM_TEST_OVERRIDE,
} from "@/lib/library-premium";
import { useEffectiveAuth } from "@/lib/dev-auth";
import { trackPhraseSaved, trackAccordionOpened } from "@/lib/analytics";

import type { LibraryEntry } from "@/lib/library";
import libraryData from "@/data/library.json";

const LIBRARY = libraryData as LibraryEntry[];


// ─── Constants ───────────────────────────────────────────────────────────────

type Level = "all" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const LEVEL_CONFIG = {
  A1: {
    label: "A1 入門",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-300",
    activeBg: "bg-slate-600",
    toeic: "〜225",
    toefl: null,
  },
  A2: {
    label: "A2 初級",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    activeBg: "bg-sky-600",
    toeic: "225〜549",
    toefl: null,
  },
  B1: {
    label: "B1 中級",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBg: "bg-emerald-600",
    toeic: "550〜780",
    toefl: "42〜71",
  },
  B2: {
    label: "B2 中上級",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBg: "bg-blue-600",
    toeic: "785〜940",
    toefl: "72〜94",
  },
  C1: {
    label: "C1 上級",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    activeBg: "bg-violet-600",
    toeic: "945〜990",
    toefl: "95〜120",
  },
  C2: {
    label: "C2 熟達",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    activeBg: "bg-rose-600",
    toeic: null,
    toefl: null,
  },
} as const;

const TYPE_LABELS: Record<ExpressionType, string> = {
  phrasal_verb: "句動詞",
  idiom: "イディオム",
  collocation: "コロケーション",
  grammar_pattern: "文法パターン",
};

/** Read-aloud control: uses Web Speech API + accent from settings (US/UK/AU). */
function SpeakLineButton({
  text,
  lang,
  accentLabel,
  ariaLabel,
}: {
  text: string;
  lang: string;
  accentLabel: string;
  ariaLabel: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isSpeechSynthesisSupported()) return null;

  return (
    <button
      type="button"
      onClick={() => speakEnglish(text, lang)}
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5",
        "text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/80 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
      )}
      aria-label={ariaLabel}
      title={`読み上げ（設定: ${accentLabel} · ${lang}）`}
    >
      <Volume2 className="w-4 h-4" />
    </button>
  );
}

// ─── ExpressionCard ───────────────────────────────────────────────────────────

function ExpressionCard({
  entry,
  isSavedInitially,
  isSignedIn,
  isPremium,
  onSaved,
}: {
  entry: LibraryEntry;
  isSavedInitially: boolean;
  isSignedIn: boolean;
  isPremium: boolean;
  onSaved: (expressionLower: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(isSavedInitially);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<"saved" | "dup" | "limit" | null>(null);
  const { lang: speakLang, accent: accentSetting } = useAccentLang();

  const cfg = LEVEL_CONFIG[entry.level];
  const exprKey = entry.expression.toLowerCase();

  useEffect(() => {
    setSaved(isSavedInitially);
  }, [isSavedInitially]);

  const handleSave = () => {
    if (!isPremium) {
      toast.info("マイページへの保存はプレミアム会員限定です", {
        description: "アップグレードですべての表現を保存し、深い解説も読み放題になります",
        action: {
          label: "アップグレード",
          onClick: () => {
            window.location.href = "/upgrade";
          },
        },
        duration: 5000,
      });
      return;
    }
    if (saved || saving) return;
    if (isSignedIn) {
      setSaving(true);
      void saveVocabularyAction({
        expression: entry.expression,
        type: entry.type,
        cefr_level: entry.level,
        meaning_ja: entry.meaning_ja,
        nuance: entry.nuance,
        example: entry.goodExample,
        example_translation: entry.goodExampleJa,
        context: entry.context,
        why_hard_for_japanese: entry.why_hard_for_japanese,
        status: "learning",
      })
        .then((result) => {
          if (result.success) {
            setSaved(true);
            onSaved(exprKey);
            setFlash("saved");
            toast.success("保存しました");
            setTimeout(() => setFlash(null), 2000);
            trackPhraseSaved({
              expression: entry.expression,
              type: entry.type,
              cefr_level: entry.level,
              source: "library",
            });
          } else if (result.reason === "duplicate") {
            setSaved(true);
            onSaved(exprKey);
            setFlash("dup");
            toast.info("この表現はすでに保存されています");
            setTimeout(() => setFlash(null), 2500);
          } else {
            toast.error(result.error);
          }
        })
        .finally(() => setSaving(false));
      return;
    }

    const result = savePhrase({
      expression: entry.expression,
      type: entry.type,
      cefr_level: entry.level,
      meaning_ja: entry.meaning_ja,
      nuance: entry.nuance,
      example: entry.goodExample,
      example_translation: entry.goodExampleJa,
      context: entry.context,
      why_hard_for_japanese: entry.why_hard_for_japanese,
    });
    if (result.success) {
      setSaved(true);
      onSaved(exprKey);
      setFlash("saved");
      setTimeout(() => setFlash(null), 2000);
      trackPhraseSaved({
        expression: entry.expression,
        type: entry.type,
        cefr_level: entry.level,
        source: "library",
      });
    } else {
      setFlash(result.reason === "duplicate" ? "dup" : "limit");
      setTimeout(() => setFlash(null), 2500);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md",
        open ? "border-indigo-200 shadow-[0_4px_20px_rgba(99,102,241,0.10)]" : "border-slate-200"
      )}
    >
      {/* ── Top ── */}
      <div className="p-5 pb-4">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={cn(
              "text-[10px] font-mono font-bold px-2 py-0.5 rounded border",
              cfg.bg,
              cfg.color,
              cfg.border
            )}
          >
            {cfg.label}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">
            {TYPE_LABELS[entry.type]}
          </span>
        </div>

        {/* Expression + read-aloud */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight min-w-0 flex-1">
            {entry.expression}
          </h3>
          <SpeakLineButton
            text={entry.expression}
            lang={speakLang}
            accentLabel={accentSetting}
            ariaLabel={`表現「${entry.expression}」を読み上げ`}
          />
        </div>
        <p className="text-sm text-slate-500 mb-4">{entry.meaning_ja}</p>

        {/* Core image */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
          <Lightbulb className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-700 font-medium leading-relaxed">
            <span className="font-bold text-indigo-500 font-mono mr-1">CORE</span>
            {entry.coreImage}
          </p>
        </div>

        {/* Examples */}
        <div className="space-y-1.5 text-sm">
          {entry.badExample && (
            <div className="flex items-start gap-2">
              <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <span className="text-slate-400 line-through">{entry.badExample}</span>
            </div>
          )}
          {entry.warnExample && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-slate-500">{entry.warnExample}</span>
              </div>
              {entry.warnNote && (
                <p className="text-[11px] text-amber-600 ml-6">{entry.warnNote}</p>
              )}
            </div>
          )}
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-slate-800 font-medium">{entry.goodExample}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{entry.goodExampleJa}</p>
              </div>
              <SpeakLineButton
                text={entry.goodExample}
                lang={speakLang}
                accentLabel={accentSetting}
                ariaLabel="例文を読み上げ"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Accordion ── */}
      <button
        type="button"
        onClick={() => {
          if (!isPremium) {
            toast.info("詳細ニュアンスはプレミアム会員限定です", {
              description: "アップグレードで全表現の深い解説が読み放題になります",
              action: {
                label: "アップグレード",
                onClick: () => {
                  window.location.href = "/upgrade";
                },
              },
              duration: 5000,
            });
            return;
          }
          setOpen((v) => {
            const opening = !v;
            if (opening) {
              trackAccordionOpened({
                expression: entry.expression,
                cefr_level: entry.level,
                source: "library",
              });
            }
            return opening;
          });
        }}
        className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors rounded-b-none"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {!isPremium ? (
            <Lock
              className="w-3 h-3 text-violet-400/90 shrink-0"
              aria-hidden
            />
          ) : null}
          {open ? "閉じる" : "詳しいニュアンスを見る"}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0" />
        )}
      </button>

      {!isPremium ? (
        <div className="px-5 py-2 border-t border-dashed border-slate-200/80 bg-slate-50/30">
          <Link
            href="/library/grammar"
            className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-violet-600/90 hover:text-violet-500 transition-colors"
          >
            文法特集で無料学習 →
          </Link>
        </div>
      ) : null}

      {open && isPremium ? (
        <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm bg-white rounded-b-2xl">
          <div>
            <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-1">
              Nuance
            </p>
            <p className="text-slate-600 leading-relaxed">{entry.nuance}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
              使用シーン
            </p>
            <p className="text-slate-600 leading-relaxed">{entry.context}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
              なぜ日本人に難しいか
            </p>
            <p className="text-slate-600 leading-relaxed">{entry.why_hard_for_japanese}</p>
          </div>
        </div>
      ) : null}

      {/* ── Save Button ── */}
      <div className="px-5 py-4 border-t border-slate-100">
        <button
          onClick={handleSave}
          disabled={saved || saving}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all",
            saved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
              : !isPremium
                ? "bg-white border border-dashed border-slate-200 text-slate-500 hover:border-violet-200 hover:text-violet-700 hover:bg-violet-50/30"
                : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              保存中…
            </>
          ) : saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              マイページに保存済み
            </>
          ) : (
            <>
              {!isPremium ? (
                <Lock className="h-3.5 w-3.5 text-violet-400/80" aria-hidden />
              ) : (
                <BookmarkPlus className="h-3.5 w-3.5" />
              )}
              マイページに保存
              {flash === "limit" && (
                <span className="ml-auto text-[10px] text-rose-400 font-semibold">
                  上限に達しました
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const SM_BREAKPOINT_PX = 640;

function useIsSmGridUp(): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") return () => {};
    const mq = window.matchMedia(`(min-width: ${SM_BREAKPOINT_PX}px)`);
    mq.addEventListener("change", onStoreChange);
    return () => mq.removeEventListener("change", onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(min-width: ${SM_BREAKPOINT_PX}px)`).matches;
  }, []);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Window スクロール + 行単位（1列 / 2列）で ExpressionCard を仮想化 */
function VirtualizedExpressionRows({
  entries,
  columns,
  savedExpressions,
  isSignedIn,
  isPremium,
  onSaved,
}: {
  entries: LibraryEntry[];
  columns: 1 | 2;
  savedExpressions: Set<string>;
  isSignedIn: boolean;
  isPremium: boolean;
  onSaved: (expressionLower: string) => void;
}) {
  const listAnchorRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const rowCount = Math.ceil(entries.length / columns);

  useLayoutEffect(() => {
    const el = listAnchorRef.current;
    if (!el) return;
    const update = () => {
      setScrollMargin(Math.round(el.getBoundingClientRect().top + window.scrollY));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [entries.length, columns]);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => (columns === 2 ? 400 : 440),
    overscan: 6,
    gap: 16,
    scrollMargin,
    enabled: entries.length > 0,
    measureElement,
    getItemKey: (rowIndex) => {
      const start = rowIndex * columns;
      return entries
        .slice(start, start + columns)
        .map((e) => e.id)
        .join("|");
    },
  });

  return (
    <div ref={listAnchorRef} className="relative w-full">
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const start = virtualRow.index * columns;
          const rowEntries = entries.slice(start, start + columns);
          // start は文書座標に scrollMargin が含まれる。リスト用ラッパー内ではローカル座標に直す
          const offsetY = virtualRow.start - scrollMargin;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${offsetY}px)` }}
            >
              <div
                className={cn(
                  "grid gap-4",
                  columns === 2 ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                {rowEntries.map((entry) => (
                  <ExpressionCard
                    key={entry.id}
                    entry={entry}
                    isSavedInitially={savedExpressions.has(
                      entry.expression.toLowerCase()
                    )}
                    isSignedIn={isSignedIn}
                    isPremium={isPremium}
                    onSaved={onSaved}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { isPro: devProSimulated } = useEffectiveAuth();

  /** 未ログイン時は user の読み込みを待たない（Clerk の挙動差でブロックされないように） */
  const ready = authLoaded && (!isSignedIn || userLoaded);
  const stripeStatus = getStripeStatusFromUserPublicMetadata(
    user?.publicMetadata as Record<string, unknown> | null | undefined
  );
  /** DEV パネルで Pro を選んでいるときは Stripe より先にフル閲覧 */
  const isPremium =
    ready &&
    (devProSimulated ||
      isLibraryPremiumAccess(LIBRARY_PREMIUM_TEST_OVERRIDE, stripeStatus));

  /** 非プレミアム向けフリーミアム案内バナー */
  const showPremiumTeaser = ready && !isPremium;

  // ── State ──────────────────────────────────────────────────────────────────
  type CefrKey = Exclude<Level, "all">;
  const [selectedLevels, setSelectedLevels] = useState<Set<CefrKey>>(new Set());
  const [searchQuery,    setSearchQuery]    = useState("");
  const [shuffleKey,     setShuffleKey]     = useState(0);
  const [savedExpressions, setSavedExpressions] = useState<Set<string>>(new Set());

  const handleVocabSaved = useCallback((expressionLower: string) => {
    setSavedExpressions((prev) => {
      const next = new Set(prev);
      next.add(expressionLower);
      return next;
    });
  }, []);

  useEffect(() => {
    const { defaultLevel } = getSettings();
    setSelectedLevels(new Set([defaultLevel as CefrKey]));
  }, []);

  useEffect(() => {
    if (isSignedIn === undefined) return;
    if (!isSignedIn) {
      setSavedExpressions(
        new Set(getVocabulary().map((v) => v.expression.toLowerCase()))
      );
      return;
    }
    void listSavedExpressionKeysAction().then((keys) =>
      setSavedExpressions(new Set(keys))
    );
  }, [isSignedIn]);

  // ── Toggle level chip ──────────────────────────────────────────────────────
  const toggleLevel = (lv: CefrKey) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lv)) { next.delete(lv); } else { next.add(lv); }
      return next;
    });
  };

  // ── Filter → search → shuffle ─────────────────────────────────────────────
  const levelFiltered = useMemo(
    () => selectedLevels.size === 0
      ? LIBRARY
      : LIBRARY.filter((e) => selectedLevels.has(e.level as CefrKey)),
    [selectedLevels]
  );

  const searched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return levelFiltered;
    return levelFiltered.filter(
      (e) =>
        e.expression.toLowerCase().includes(q) ||
        e.meaning_ja.includes(q)
    );
  }, [levelFiltered, searchQuery]);

  const displayList = useMemo(() => {
    if (shuffleKey === 0) return searched;
    const arr = [...searched];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [searched, shuffleKey]);

  const countByLevel = (lv: CefrKey) => LIBRARY.filter((e) => e.level === lv).length;

  // ── Score detail for selected single level ────────────────────────────────
  const scoreDetailLevel: CefrKey | null =
    selectedLevels.size === 1 ? (Array.from(selectedLevels)[0] ?? null) : null;

  const isSmGridUp = useIsSmGridUp();
  const gridColumns: 1 | 2 = isSmGridUp ? 2 : 1;

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="5xl" right={<GlobalNav />} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative">
        <div>
        {showPremiumTeaser ? (
          <div
            className={cn(
              "mb-6 rounded-2xl border border-violet-200/70 px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm shadow-violet-900/5",
              "bg-gradient-to-br from-violet-100/90 via-purple-50/95 to-indigo-50/90",
              "backdrop-blur-sm",
              "ring-1 ring-inset ring-white/60"
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-600/80 mb-1">
                  Library · Freemium
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  ニュアンス詳細はプレミアム会員限定
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  一覧・コアイメージ・例文は無料。「詳しいニュアンスを見る」とマイページ保存はプレミアムのみ。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs shrink-0 sm:pt-0.5">
                <Link
                  href="/upgrade"
                  className="font-mono font-semibold text-violet-800 hover:text-violet-700 underline underline-offset-2 transition-colors"
                >
                  プレミアムになる →
                </Link>
                <span className="text-violet-300/90 font-mono hidden sm:inline" aria-hidden>
                  |
                </span>
                <Link
                  href="/library/grammar"
                  className="font-mono font-semibold text-slate-700 hover:text-violet-800 underline underline-offset-2 transition-colors"
                >
                  まずは無料の文法特集を読む →
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Page Header ── */}
        <div className="mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-mono font-semibold tracking-wider mb-4">
            <Zap className="w-3 h-3" />
            Expression Library
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            日本人が使いこなせていない
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              厳選英語表現
            </span>
          </h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-2xl">
            「知っている」けど「口から出てこない」表現を、コアイメージとともに解説。
            make / get / take を中心に、ネイティブが多用するフレーズを厳選しました。
          </p>
        </div>

        {/* ── Level Filter (multi-select chips) ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              レベルで絞り込む（CEFR）
            </label>
            {selectedLevels.size > 0 && (
              <button
                onClick={() => setSelectedLevels(new Set())}
                className="text-[11px] text-slate-400 hover:text-indigo-500 transition-colors"
              >
                すべて表示 ({LIBRARY.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {(["A1", "A2", "B1", "B2", "C1", "C2"] as CefrKey[]).map((lv) => {
              const isActive = selectedLevels.has(lv);
              const cfg = LEVEL_CONFIG[lv];
              return (
                <button
                  key={lv}
                  onClick={() => toggleLevel(lv)}
                  className={cn(
                    "relative p-2.5 rounded-xl border text-left transition-all",
                    isActive
                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                  <div className={cn(
                    "text-sm font-bold font-mono leading-none mb-1",
                    isActive ? "text-indigo-600" : "text-slate-700"
                  )}>
                    {lv}
                  </div>
                  <div className={cn(
                    "text-[10px] font-medium leading-tight",
                    isActive ? "text-indigo-500" : "text-slate-400"
                  )}>
                    {cfg.label.replace(`${lv} `, "")}
                  </div>
                  {cfg.toeic && (
                    <div className="text-[9px] text-slate-400 mt-1 leading-tight">
                      {cfg.toeic}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 単一レベル選択時のスコア詳細 */}
          {scoreDetailLevel && (
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-400">
              {LEVEL_CONFIG[scoreDetailLevel].toeic && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                  TOEIC: {LEVEL_CONFIG[scoreDetailLevel].toeic}
                </span>
              )}
              {LEVEL_CONFIG[scoreDetailLevel].toefl && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                  TOEFL iBT: {LEVEL_CONFIG[scoreDetailLevel].toefl}
                </span>
              )}
              {!LEVEL_CONFIG[scoreDetailLevel].toeic && !LEVEL_CONFIG[scoreDetailLevel].toefl && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                  ネイティブ近傍レベル
                </span>
              )}
              <span>{countByLevel(scoreDetailLevel)} 件</span>
            </div>
          )}
        </div>

        {/* ── Search + Shuffle ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="表現・日本語で検索..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShuffleKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 text-sm font-medium transition-all"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">シャッフル</span>
          </button>
          <p className="text-xs text-slate-400 font-mono ml-auto hidden sm:block">
            {displayList.length} 件
          </p>
        </div>

        {/* ── Card Grid（window 仮想スクロール） ── */}
        <div className="relative">
          {displayList.length > 0 && (
            <VirtualizedExpressionRows
              entries={displayList}
              columns={gridColumns}
              savedExpressions={savedExpressions}
              isSignedIn={Boolean(isSignedIn)}
              isPremium={isPremium}
              onSaved={handleVocabSaved}
            />
          )}

          {/* 検索ゼロヒット */}
          {displayList.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">「{searchQuery}」に一致する表現が見つかりませんでした</p>
            </div>
          )}
        </div>
        </div>

      </main>
    </div>
  );
}
