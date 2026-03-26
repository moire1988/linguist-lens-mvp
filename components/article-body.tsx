"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useEffectiveAuth } from "@/lib/dev-auth";
import {
  Volume2, VolumeX, BookmarkPlus, Check,
  Mic, MicOff, ChevronDown, Lock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, getBestEnglishVoice } from "@/lib/utils";
import { getSettings, ACCENT_LANG } from "@/lib/settings";
import { TranslationAccordion } from "@/components/translation-accordion";
import {
  savePhrase, getVocabulary, getDailyRemaining, FREE_DAILY_LIMIT,
} from "@/lib/vocabulary";
import {
  saveVocabularyAction,
  listSavedExpressionKeysAction,
} from "@/app/actions/vocabulary";
import { openLoginPrompt } from "@/lib/login-prompt-store";
import type { ArticleVocabItem, EnglishVariant } from "@/lib/article-types";

// ─── Speech recognition types ────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: { isFinal: boolean; [i: number]: { transcript: string } }[];
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

type Feedback = "excellent" | "passed" | "retry";
const FEEDBACK_CONFIG: Record<Feedback, { label: string; className: string }> = {
  excellent: { label: "Excellent! ✨", className: "text-emerald-600" },
  passed:    { label: "Passed! ✅",    className: "text-blue-600"    },
  retry:     { label: "Try again 🔄", className: "text-amber-600"   },
};

function evaluate(recognized: string, example: string, expression: string): Feedback {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const recSet = new Set(norm(recognized));
  const exOverlap = norm(example).filter((w) => recSet.has(w)).length / (norm(example).length || 1);
  const tgtOverlap = norm(expression).filter((w) => recSet.has(w)).length / (norm(expression).length || 1);
  if (exOverlap >= 0.75) return "excellent";
  if (tgtOverlap >= 0.6)  return "passed";
  return "retry";
}

function renderDiff(recognized: string, example: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const recSet = new Set(recognized.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean));
  return example.split(/(\s+)/).map((token, i) => {
    if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
    const matched = recSet.has(norm(token));
    return (
      <span key={i} className={matched ? "text-emerald-600 font-bold" : "text-rose-500 font-bold underline decoration-dotted"}>
        {token}
      </span>
    );
  });
}

// ─── Badge configs ────────────────────────────────────────────────────────────

const POS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  "phrasal verb": { label: "句動詞",   bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
  verb:           { label: "動詞",     bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200"     },
  noun:           { label: "名詞",     bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200"     },
  adjective:      { label: "形容詞",   bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200"     },
  adverb:         { label: "副詞",     bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200"     },
  phrase:         { label: "フレーズ", bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
};
const POS_DEFAULT = { label: "語彙", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };

const CEFR_CONFIG: Record<string, { bg: string; text: string }> = {
  A1: { bg: "bg-slate-100",  text: "text-slate-600"  },
  A2: { bg: "bg-green-100",  text: "text-green-700"  },
  B1: { bg: "bg-blue-100",   text: "text-blue-700"   },
  B2: { bg: "bg-indigo-100", text: "text-indigo-700" },
  C1: { bg: "bg-purple-100", text: "text-purple-700" },
  C2: { bg: "bg-rose-100",   text: "text-rose-700"   },
};

// ─── TTS helper ───────────────────────────────────────────────────────────────

function speak(text: string, variant: EnglishVariant, rate = 0.85) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const { accent } = getSettings();
  const eff = variant === "common" ? accent : (variant as "US" | "UK" | "AU");
  u.lang  = ACCENT_LANG[eff] ?? "en-US";
  u.rate  = rate;
  const v = getBestEnglishVoice(eff);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

// ─── Popup ────────────────────────────────────────────────────────────────────

interface PopupData {
  word: string; meaning: string; nuance: string; example: string;
  top: number; left: number;
}

function VocabPopup({
  data, isSignedIn, isSaved, dailyRemaining,
  englishVariant, articleLevel,
  isSaving,
  onSave, onMouseEnter, onMouseLeave,
}: {
  data: PopupData; isSignedIn: boolean; isSaved: boolean; dailyRemaining: number;
  isSaving?: boolean;
  englishVariant: EnglishVariant; articleLevel: string;
  onSave: () => void; onMouseEnter: () => void; onMouseLeave: () => void;
}) {
  const [isSpeakingWord, setIsSpeakingWord] = useState(false);
  const [isListening, setIsListening]       = useState(false);
  const [recognized, setRecognized]         = useState("");
  const [feedback, setFeedback]             = useState<Feedback | null>(null);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const cefrCfg = CEFR_CONFIG[articleLevel] ?? CEFR_CONFIG.B2;

  const safeLeft = typeof window !== "undefined" ? Math.max(8, Math.min(data.left, window.innerWidth - 312)) : data.left;

  const handleSpeakWord = () => {
    if (isSpeakingWord) { window.speechSynthesis.cancel(); setIsSpeakingWord(false); return; }
    speak(data.word, englishVariant, 0.82);
    setIsSpeakingWord(true);
    window.speechSynthesis.addEventListener("end", () => setIsSpeakingWord(false), { once: true });
  };

  const handleSpeakExample = () => speak(data.example, englishVariant, 0.88);

  const handlePractice = () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { toast.error("音声認識はChrome / Edgeでご利用ください"); return; }
    if (isListening) { recRef.current?.stop(); return; }
    setRecognized(""); setFeedback(null);
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setRecognized(t); setFeedback(evaluate(t, data.example, data.word));
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recRef.current = rec; rec.start(); setIsListening(true);
  };

  return (
    <div
      data-vocab-popup
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: "fixed", top: data.top, left: safeLeft, zIndex: 60, width: 300 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
    >
      {isSignedIn ? (
        <>
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", cefrCfg.bg, cefrCfg.text)}>
                {articleLevel}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <p className="text-[1.15rem] font-bold text-slate-900 leading-tight flex-1">{data.word}</p>
              <button
                onClick={handleSpeakWord}
                className={cn("flex-shrink-0 p-1.5 rounded-xl transition-all mt-0.5",
                  isSpeakingWord ? "bg-indigo-100 text-indigo-600" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                )}
                title={isSpeakingWord ? "停止" : "発音を聞く"}
              >
                {isSpeakingWord ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-700 mt-1">{data.meaning}</p>
          </div>

          {/* Nuance */}
          {data.nuance && (
            <div className="mx-4 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ニュアンス</p>
              <p className="text-xs text-slate-600 leading-relaxed">{data.nuance}</p>
            </div>
          )}

          {/* Example */}
          {data.example && (
            <div className="mx-4 mb-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">例文</p>
                <div className="flex items-center gap-1">
                  <button onClick={handleSpeakExample} className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors" title="例文を読み上げ">
                    <Volume2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handlePractice}
                    className={cn("flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors",
                      isListening ? "bg-rose-100 text-rose-500 animate-pulse" : "hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600"
                    )}
                  >
                    {isListening ? <><MicOff className="h-3 w-3" /> Stop</> : <><Mic className="h-3 w-3" /> Practice</>}
                  </button>
                </div>
              </div>
              <p className="text-xs text-indigo-900 font-medium leading-relaxed">{data.example}</p>
              {isListening && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <p className="text-xs text-rose-500 font-medium">Listening...</p>
                </div>
              )}
              {!isListening && recognized && (
                <div className="mt-1.5 space-y-1">
                  <p className="text-xs leading-relaxed">{renderDiff(recognized, data.example)}</p>
                  {feedback && (
                    <p className={cn("text-xs font-bold", FEEDBACK_CONFIG[feedback].className)}>
                      {FEEDBACK_CONFIG[feedback].label}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Save */}
          <div className="px-4 pb-4">
            <button
              onClick={onSave}
              disabled={isSaved || dailyRemaining === 0 || isSaving}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all",
                isSaved
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                  : dailyRemaining === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
              )}
            >
              {isSaving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 保存中…</>
              ) : isSaved ? (
                <><Check className="h-3.5 w-3.5" /> 保存済み</>
              ) : (
                <><BookmarkPlus className="h-3.5 w-3.5" /> マイページに保存</>
              )}
              {!isSaved && dailyRemaining <= 2 && dailyRemaining > 0 && (
                <span className="ml-auto text-[10px] text-amber-500 font-semibold">本日あと{dailyRemaining}件</span>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="p-4 flex items-center gap-2.5 text-slate-500">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs">ログインすると意味・例文・発音が表示されます</p>
        </div>
      )}
      {/* Arrow */}
      <div className="absolute bottom-full left-5 -mb-px border-4 border-transparent border-b-white drop-shadow-[0_-1px_0_rgba(0,0,0,0.06)]" />
    </div>
  );
}

// ─── ArticleBody ──────────────────────────────────────────────────────────────

export function ArticleBody({
  contentHtml, articleLevel, articleTitle, englishVariant,
}: {
  contentHtml: string; articleLevel: string; articleTitle: string; englishVariant: EnglishVariant;
}) {
  const { isLoaded } = useAuth();
  const { isSignedIn } = useEffectiveAuth();
  const containerRef   = useRef<HTMLDivElement>(null);
  const hideTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popup, setPopup]               = useState<PopupData | null>(null);
  const [savedWords, setSavedWords]     = useState<Set<string>>(new Set());
  const [dailyRemaining, setDailyRem]   = useState(FREE_DAILY_LIMIT);
  const [savingWord, setSavingWord]     = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn === undefined) return;
    if (!isSignedIn) {
      setSavedWords(
        new Set(getVocabulary().map((p) => p.expression.toLowerCase()))
      );
      setDailyRem(getDailyRemaining());
      return;
    }
    void listSavedExpressionKeysAction().then((keys) =>
      setSavedWords(new Set(keys))
    );
    setDailyRem(999);
  }, [isSignedIn]);

  useEffect(() => {
    const close = () => setPopup(null);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setPopup(null), 220);
  }, []);
  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onOver = (e: MouseEvent) => {
      const span = (e.target as HTMLElement).closest(".vocabulary-highlight") as HTMLElement | null;
      if (!span) return;
      cancelHide();
      const rect = span.getBoundingClientRect();
      setPopup({
        word:    span.dataset.word    ?? span.textContent ?? "",
        meaning: span.dataset.meaning ?? "",
        nuance:  span.dataset.nuance  ?? "",
        example: span.dataset.example ?? "",
        top:  rect.bottom + 8,
        left: rect.left,
      });
    };
    const onOut = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".vocabulary-highlight")) return;
      if ((e.relatedTarget as HTMLElement | null)?.closest("[data-vocab-popup]")) return;
      scheduleHide();
    };
    container.addEventListener("mouseover", onOver);
    container.addEventListener("mouseout", onOut);
    return () => { container.removeEventListener("mouseover", onOver); container.removeEventListener("mouseout", onOut); };
  }, [cancelHide, scheduleHide]);

  const handleSave = useCallback(async () => {
    if (!popup) return;
    const key = popup.word.toLowerCase();
    if (!isSignedIn) {
      const result = savePhrase({
        expression: popup.word,
        type: "collocation",
        cefr_level: articleLevel,
        meaning_ja: popup.meaning,
        nuance: "",
        example: popup.example,
        context: `記事: ${articleTitle}`,
        why_hard_for_japanese: "",
      });
      if (result.success) {
        setSavedWords((s) => {
          const n = new Set(Array.from(s));
          n.add(key);
          return n;
        });
        setDailyRem((r) => Math.max(0, r - 1));
        toast.success("保存しました", {
          description: `「${popup.word}」をマイページに追加しました`,
        });
      } else if (result.reason === "limit_reached") {
        toast.error(`本日の保存上限（${FREE_DAILY_LIMIT}件）に達しました`);
      }
      return;
    }

    setSavingWord(key);
    try {
      const result = await saveVocabularyAction({
        expression: popup.word,
        type: "collocation",
        cefr_level: articleLevel,
        meaning_ja: popup.meaning,
        nuance: popup.nuance || "",
        example: popup.example,
        context: `記事: ${articleTitle}`,
        why_hard_for_japanese: "",
        status: "learning",
      });
      if (result.success) {
        setSavedWords((s) => {
          const n = new Set(Array.from(s));
          n.add(key);
          return n;
        });
        toast.success("保存しました", {
          description: `「${popup.word}」をマイページに追加しました`,
        });
      } else if (result.reason === "duplicate") {
        setSavedWords((s) => {
          const n = new Set(Array.from(s));
          n.add(key);
          return n;
        });
        toast.info("この表現はすでに保存されています");
      } else {
        toast.error(result.error);
      }
    } finally {
      setSavingWord(null);
    }
  }, [popup, articleLevel, articleTitle, isSignedIn]);

  const cursorClass = !isLoaded ? "" : isSignedIn
    ? "[&_.vocabulary-highlight]:cursor-pointer"
    : "[&_.vocabulary-highlight]:cursor-help";

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "prose prose-slate prose-sm sm:prose-base max-w-none mb-10",
          "prose-p:leading-relaxed prose-p:text-slate-700",
          "[&_.vocabulary-highlight]:bg-violet-100",
          "[&_.vocabulary-highlight]:text-violet-900",
          "[&_.vocabulary-highlight]:px-1 [&_.vocabulary-highlight]:py-0.5",
          "[&_.vocabulary-highlight]:rounded",
          "[&_.vocabulary-highlight]:font-semibold",
          "[&_.vocabulary-highlight]:border-b-2",
          "[&_.vocabulary-highlight]:border-violet-400",
          "[&_.vocabulary-highlight]:select-none",
          cursorClass,
        )}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      {popup && (
        <VocabPopup
          data={popup}
          isSignedIn={!!isSignedIn}
          isSaved={savedWords.has(popup.word.toLowerCase())}
          dailyRemaining={dailyRemaining}
          englishVariant={englishVariant}
          articleLevel={articleLevel}
          isSaving={savingWord === popup.word.toLowerCase()}
          onSave={() => void handleSave()}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        />
      )}
    </>
  );
}

// ─── ArticleVocabCard ─────────────────────────────────────────────────────────

export function ArticleVocabCard({
  item, articleLevel, articleTitle, englishVariant,
}: {
  item: ArticleVocabItem; articleLevel: string; articleTitle: string; englishVariant: EnglishVariant;
}) {
  const { isSignedIn } = useAuth();
  const [isSpeakingWord,    setIsSpeakingWord]    = useState(false);
  const [showDetail,        setShowDetail]         = useState(false);
  const [isListening,       setIsListening]        = useState(false);
  const [recognized,        setRecognized]         = useState("");
  const [feedback,          setFeedback]           = useState<Feedback | null>(null);
  const [isSaved,           setIsSaved]            = useState(false);
  const [dailyRemaining,    setDailyRem]           = useState(FREE_DAILY_LIMIT);
  const [saving,            setSaving]             = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (isSignedIn === undefined) return;
    if (!isSignedIn) {
      const vocab = getVocabulary();
      setIsSaved(
        vocab.some((p) => p.expression.toLowerCase() === item.word.toLowerCase())
      );
      setDailyRem(getDailyRemaining());
      return;
    }
    void listSavedExpressionKeysAction().then((keys) => {
      setIsSaved(keys.includes(item.word.toLowerCase()));
    });
    setDailyRem(999);
  }, [isSignedIn, item.word]);

  useEffect(() => () => { recRef.current?.stop(); }, []);

  const posCfg = POS_CONFIG[item.partOfSpeech] ?? POS_DEFAULT;
  const cefrCfg = CEFR_CONFIG[articleLevel] ?? CEFR_CONFIG.B2;

  const handleSpeakWord = useCallback(() => {
    if (!("speechSynthesis" in window)) { toast.error("このブラウザは音声読み上げに対応していません"); return; }
    if (isSpeakingWord) { window.speechSynthesis.cancel(); setIsSpeakingWord(false); return; }
    const u = new SpeechSynthesisUtterance(item.word);
    const { accent } = getSettings();
    const eff = englishVariant === "common" ? accent : (englishVariant as "US" | "UK" | "AU");
    u.lang = ACCENT_LANG[eff] ?? "en-US"; u.rate = 0.82;
    const v = getBestEnglishVoice(eff); if (v) u.voice = v;
    u.onend = () => setIsSpeakingWord(false); u.onerror = () => setIsSpeakingWord(false);
    setIsSpeakingWord(true); window.speechSynthesis.speak(u);
  }, [item.word, englishVariant, isSpeakingWord]);

  const handleSpeakExample = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(item.dynamicExample);
    const { accent } = getSettings();
    const eff = englishVariant === "common" ? accent : (englishVariant as "US" | "UK" | "AU");
    u.lang = ACCENT_LANG[eff] ?? "en-US"; u.rate = 0.88;
    const v = getBestEnglishVoice(eff); if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }, [item.dynamicExample, englishVariant]);

  const handlePractice = useCallback(() => {
    if (!isSignedIn) {
      openLoginPrompt("practice");
      return;
    }
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { toast.error("音声認識はChrome / Edgeでご利用ください"); return; }
    if (isListening) { recRef.current?.stop(); return; }
    setRecognized(""); setFeedback(null);
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setRecognized(t); setFeedback(evaluate(t, item.dynamicExample, item.word));
    };
    rec.onerror = () => setIsListening(false); rec.onend = () => setIsListening(false);
    recRef.current = rec; rec.start(); setIsListening(true);
  }, [isListening, item.dynamicExample, item.word]);

  const handleSave = useCallback(async () => {
    if (isSaved || saving) return;
    if (!isSignedIn) {
      openLoginPrompt("save");
      return;
    }
    setSaving(true);
    try {
      const result = await saveVocabularyAction({
        expression: item.word,
        type:
          item.partOfSpeech === "phrasal verb" ? "phrasal_verb" : "collocation",
        cefr_level: articleLevel,
        meaning_ja: item.meaning,
        nuance: item.nuance,
        example: item.dynamicExample,
        example_translation: item.dynamicExampleTranslation,
        context: `記事: ${articleTitle}`,
        why_hard_for_japanese: "",
        status: "learning",
      });
      if (result.success) {
        setIsSaved(true);
        toast.success("保存しました", {
          description: `「${item.word}」をマイページに追加しました`,
        });
      } else if (result.reason === "duplicate") {
        setIsSaved(true);
        toast.info("この表現はすでに保存されています");
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }, [isSaved, saving, isSignedIn, item, articleLevel, articleTitle]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      <div className="p-5 flex-1">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", posCfg.bg, posCfg.text, posCfg.border)}>
            {posCfg.label}
          </span>
          <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", cefrCfg.bg, cefrCfg.text)}>
            {articleLevel}
          </span>
        </div>

        {/* Word + TTS */}
        <div className="flex items-start gap-2 mb-3">
          <h3 className="text-[1.35rem] font-bold text-slate-900 tracking-tight leading-tight flex-1">
            {item.word}
          </h3>
          <button
            onClick={handleSpeakWord}
            className={cn("flex-shrink-0 p-2 rounded-xl transition-all mt-0.5",
              isSpeakingWord ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-200" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            )}
            title={isSpeakingWord ? "停止" : "発音を聞く"}
          >
            {isSpeakingWord ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Meaning */}
        <div className="mb-3.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">意味</p>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{item.meaning}</p>
        </div>

        {/* Nuance */}
        {item.nuance && (
          <div className="mb-3.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ニュアンス解説</p>
            <p className="text-sm text-slate-600 leading-relaxed">{item.nuance}</p>
          </div>
        )}

        {/* Example + TTS + Practice */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">例文</p>
            <div className="flex items-center gap-1">
              <button onClick={handleSpeakExample} className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors" title="例文を読み上げ">
                <Volume2 className="h-3 w-3" />
              </button>
              <button
                onClick={handlePractice}
                className={cn("flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors",
                  isListening ? "bg-rose-100 text-rose-500 animate-pulse" : "hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600"
                )}
                title={isListening ? "停止" : "音読練習"}
              >
                {isListening ? <><MicOff className="h-3 w-3" /> Stop</> : <><Mic className="h-3 w-3" /> Practice</>}
              </button>
            </div>
          </div>
          <p className="text-sm text-indigo-900 font-medium leading-relaxed">{item.dynamicExample}</p>
          {item.dynamicExampleTranslation && (
            <TranslationAccordion text={item.dynamicExampleTranslation} variant="indigo" />
          )}
          {isListening && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-xs text-rose-500 font-medium">Listening...</p>
            </div>
          )}
          {!isListening && recognized && (
            <div className="mt-2 space-y-1.5">
              <p className="text-sm leading-relaxed">{renderDiff(recognized, item.dynamicExample)}</p>
              <p className="text-[11px] text-indigo-400 italic">「{recognized}」</p>
              {feedback && <p className={cn("text-xs font-bold", FEEDBACK_CONFIG[feedback].className)}>{FEEDBACK_CONFIG[feedback].label}</p>}
            </div>
          )}
        </div>
      </div>

      {/* 学習のポイント */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="w-full px-5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span className="text-xs font-medium text-slate-400">学習のポイント</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-200", showDetail && "rotate-180")} />
        </button>
        {showDetail && (
          <div className="px-5 pb-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">{item.word}</span> は{item.meaning}を意味します。
              文脈に合わせて自然に使えるよう、例文を声に出して練習しましょう。
            </p>
          </div>
        )}
      </div>

      {/* マイページに保存 */}
      <div className="px-5 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={() => void handleSave()}
          disabled={isSaved || saving || (isSignedIn && dailyRemaining === 0)}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all",
            isSaved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
              : isSignedIn && dailyRemaining === 0
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
          )}
        >
          {saving ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 保存中…</>
          ) : isSaved ? (
            <><Check className="h-3.5 w-3.5" /> マイページに保存済み</>
          ) : (
            <>
              <BookmarkPlus className="h-3.5 w-3.5" /> マイページに保存
              {isSignedIn && dailyRemaining <= 2 && dailyRemaining > 0 && (
                <span className="ml-auto text-[10px] text-amber-500 font-semibold">本日あと{dailyRemaining}件</span>
              )}
              {isSignedIn && dailyRemaining === 0 && (
                <span className="ml-auto text-[10px] text-rose-400 font-semibold">上限に達しました</span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
