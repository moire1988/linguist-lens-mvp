"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  Download,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shuffle,
  Eye,
  BookMarked,
  X,
  AlertTriangle,
  Brain,
  Mic,
  MicOff,
  RotateCcw,
  Youtube,
  Globe,
  FileText,
  Quote,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn, getBestEnglishVoice } from "@/lib/utils";
import { getSettings, ACCENT_LANG } from "@/lib/settings";
import {
  getVocabulary,
  deletePhrase,
  archivePhrase,
  restorePhrase,
  clearByStatus,
  clearAll,
  exportToCSV,
  exportToMarkdown,
  type SavedPhrase,
} from "@/lib/vocabulary";
import { useAuth } from "@clerk/nextjs";
import { AdPlaceholder } from "@/components/ad-placeholder";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CoachModal } from "@/components/coach-modal";
import { TranslationAccordion } from "@/components/translation-accordion";
import {
  getSavedAnalyses,
  deleteSavedAnalysis,
  setPendingRestore,
  ANALYSIS_MAX_SLOTS,
  type SavedAnalysis,
} from "@/lib/saved-analyses";
import { getUserAnalysesAction, deleteUserAnalysisAction } from "@/app/actions/save-analysis";
import {
  archiveVocabularyAction,
  restoreVocabularyAction,
  deleteVocabularyAction,
  clearVocabularyAction,
} from "@/app/actions/vocabulary";
import { EXAMPLES } from "@/lib/examples-data";

const MIN_COACH_PHRASES = 5;

// ─── Speech Recognition types ──────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: { isFinal: boolean; [i: number]: { transcript: string } }[];
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// ─── Pronunciation scoring ─────────────────────────────────────────────────

type Feedback = "excellent" | "passed" | "retry";

function evaluate(recognized: string, example: string, expression: string): Feedback {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const recSet = new Set(norm(recognized));
  const exOverlap = norm(example).filter((w) => recSet.has(w)).length / (norm(example).length || 1);
  const tgtOverlap = norm(expression).filter((w) => recSet.has(w)).length / (norm(expression).length || 1);
  if (exOverlap >= 0.75) return "excellent";
  if (tgtOverlap >= 0.6)  return "passed";
  return "retry";
}

const FEEDBACK_CONFIG: Record<Feedback, { label: string; className: string }> = {
  excellent: { label: "Excellent! ✨", className: "text-emerald-600" },
  passed:    { label: "Passed! ✅",    className: "text-blue-600"    },
  retry:     { label: "Try again 🔄", className: "text-amber-600"   },
};

// ─── Word-level diff ───────────────────────────────────────────────────────

const EXPAND: Record<string, string[]> = {
  im:["i","am"],ive:["i","have"],id:["i","would"],ill:["i","will"],
  youre:["you","are"],youve:["you","have"],youll:["you","will"],youd:["you","would"],
  hes:["he","is"],shes:["she","is"],shell:["she","will"],its:["it","is"],weve:["we","have"],
  theyre:["they","are"],theyve:["they","have"],theyll:["they","will"],
  dont:["do","not"],doesnt:["does","not"],didnt:["did","not"],
  cant:["can","not"],wont:["will","not"],couldnt:["could","not"],
  wouldnt:["would","not"],shouldnt:["should","not"],
  isnt:["is","not"],arent:["are","not"],wasnt:["was","not"],
  werent:["were","not"],havent:["have","not"],hasnt:["has","not"],hadnt:["had","not"],
};

function stemWord(w: string): string {
  if (w.length <= 4) return w;
  if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
  if (w.endsWith("ied"))                  return w.slice(0, -3) + "y";
  if (w.endsWith("ies"))                  return w.slice(0, -3) + "y";
  if (w.endsWith("ed")  && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("es")  && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("s")   && w.length > 4) return w.slice(0, -1);
  return w;
}

function renderExampleDiff(recognized: string, example: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const recWords = recognized.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const recSet   = new Set(recWords);
  const recStems = new Set(recWords.map(stemWord));
  return example.split(/(\s+)/).map((token, i) => {
    if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
    const n = norm(token);
    if (!n) return <span key={i}>{token}</span>;
    const matched =
      recSet.has(n) ||
      (n.length >= 5 && recStems.has(stemWord(n))) ||
      (EXPAND[n] !== undefined && EXPAND[n].every((w) => recSet.has(w)));
    return (
      <span key={i} className={matched ? "text-emerald-600 font-bold" : "text-rose-500 font-bold underline decoration-dotted"}>
        {token}
      </span>
    );
  });
}

// ─── Constants ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  phrasal_verb: { label: "句動詞", color: "bg-violet-100 text-violet-700 border-violet-200" },
  idiom: { label: "イディオム", color: "bg-amber-100 text-amber-700 border-amber-200" },
  collocation: { label: "コロケーション", color: "bg-sky-100 text-sky-700 border-sky-200" },
  grammar_pattern: { label: "文法パターン", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600",
  A2: "bg-green-100 text-green-700",
  B1: "bg-blue-100 text-blue-700",
  B2: "bg-indigo-100 text-indigo-700",
  C1: "bg-purple-100 text-purple-700",
  C2: "bg-rose-100 text-rose-700",
};

// ─── VocabCard Component ──────────────────────────────────────────────────

function VocabCard({
  phrase,
  isArchived,
  onDelete,
  onArchive,
  onRestore,
}: {
  phrase: SavedPhrase;
  isArchived: boolean;
  onDelete: (id: string, expression: string) => void;
  onArchive: (id: string, expression: string) => void;
  onRestore: (id: string, expression: string) => void;
}) {
  const [isListening, setIsListening] = useState(false);
  const [recognized,  setRecognized]  = useState("");
  const [feedback,    setFeedback]    = useState<Feedback | null>(null);
  const [showDetail,  setShowDetail]  = useState(false);
  const [archiving,   setArchiving]   = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => { return () => { recognitionRef.current?.stop(); }; }, []);

  const handleSpeak = useCallback((text: string, rate = 0.85) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const { accent } = getSettings();
    u.lang = ACCENT_LANG[accent]; u.rate = rate;
    const voice = getBestEnglishVoice(accent);
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }, []);

  const handlePractice = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { toast.error("音声認識はChrome / Edgeでご利用ください"); return; }
    if (isListening) { recognitionRef.current?.stop(); return; }
    setRecognized(""); setFeedback(null);
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setRecognized(text);
      setFeedback(evaluate(text, phrase.example, phrase.expression));
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start(); setIsListening(true);
  }, [isListening, phrase.example, phrase.expression]);

  const handleArchiveClick = useCallback(async () => {
    setArchiving(true);
    await new Promise((r) => setTimeout(r, 280));
    onArchive(phrase.id, phrase.expression);
  }, [onArchive, phrase.id, phrase.expression]);

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col duration-300",
      archiving && "opacity-0 scale-95 -translate-y-1 pointer-events-none"
    )}>
      <div className="p-4 sm:p-5 flex-1">
        {/* Badges + TTS + Archive/Restore + Delete */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border",
                TYPE_CONFIG[phrase.type]?.color ?? "bg-slate-100 text-slate-600 border-slate-200")}>
                {TYPE_CONFIG[phrase.type]?.label ?? phrase.type}
              </span>
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                CEFR_COLORS[phrase.cefr_level] ?? "bg-slate-100 text-slate-600")}>
                {phrase.cefr_level}
              </span>
              <span className="text-[10px] text-slate-300 ml-auto hidden sm:block">
                {new Date(phrase.savedAt).toLocaleDateString("ja-JP")}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{phrase.expression}</h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => handleSpeak(phrase.expression, 0.82)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="発音を聞く">
              <Volume2 className="h-4 w-4" />
            </button>
            {isArchived ? (
              <button onClick={() => onRestore(phrase.id, phrase.expression)}
                className="p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition-colors" title="学習中に戻す">
                <RotateCcw className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleArchiveClick}
                className="p-2 rounded-xl hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.35)]" title="I've mastered it">
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => onDelete(phrase.id, phrase.expression)}
              className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="削除">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Context */}
        {phrase.context && (
          <div className="flex gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3.5">
            <Quote className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed italic">{phrase.context}</p>
          </div>
        )}

        {/* Meaning */}
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">意味</p>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{phrase.meaning_ja}</p>
        </div>

        {/* Nuance */}
        {phrase.nuance && (
          <div className="mb-3.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ニュアンス解説</p>
            <p className="text-sm text-slate-600 leading-relaxed">{phrase.nuance}</p>
          </div>
        )}

        {/* Example + Practice */}
        <div className="bg-indigo-50 rounded-xl px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">例文</p>
            <div className="flex items-center gap-1">
              <button onClick={() => handleSpeak(phrase.example, 0.88)}
                className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors" title="例文を読み上げ">
                <Volume2 className="h-3 w-3" />
              </button>
              <button onClick={handlePractice}
                className={cn("flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors",
                  isListening ? "bg-rose-100 text-rose-500 animate-pulse" : "hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600")}
                title={isListening ? "停止" : "音読練習"}>
                {isListening ? <><MicOff className="h-3 w-3" /> Stop</> : <><Mic className="h-3 w-3" /> Practice</>}
              </button>
            </div>
          </div>

          <p className="text-xs text-indigo-700 font-medium leading-relaxed">{phrase.example}</p>

          {phrase.example_translation && (
            <TranslationAccordion text={phrase.example_translation} variant="indigo" />
          )}

          {isListening && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-xs text-rose-500 font-medium">Listening...</p>
            </div>
          )}

          {!isListening && recognized && (
            <div className="mt-2 space-y-1.5">
              <p className="text-xs leading-relaxed">{renderExampleDiff(recognized, phrase.example)}</p>
              <p className="text-[11px] text-indigo-400 italic">「{recognized}」</p>
              {feedback && (
                <p className={cn("text-xs font-bold", FEEDBACK_CONFIG[feedback].className)}>
                  {FEEDBACK_CONFIG[feedback].label}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 学習のポイント accordion */}
      {phrase.why_hard_for_japanese && (
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
              <p className="text-xs text-slate-500 leading-relaxed">{phrase.why_hard_for_japanese}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Flashcard Component ───────────────────────────────────────────────────

function FlashCard({
  cards,
  onExit,
}: {
  cards: SavedPhrase[];
  onExit: () => void;
}) {
  const [deck, setDeck] = useState<SavedPhrase[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ known: 0, unknown: 0 });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setDeck([...cards].sort(() => Math.random() - 0.5));
  }, [cards]);

  const current = deck[index];
  const progress = deck.length > 0 ? ((index) / deck.length) * 100 : 0;

  const handleSpeak = useCallback(() => {
    if (!current || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(current.expression);
    u.lang = "en-US";
    u.rate = 0.82;
    window.speechSynthesis.speak(u);
  }, [current]);

  const next = useCallback(
    (knew: boolean) => {
      setScore((s) => ({
        known: s.known + (knew ? 1 : 0),
        unknown: s.unknown + (knew ? 0 : 1),
      }));
      if (index + 1 >= deck.length) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
        setRevealed(false);
      }
    },
    [index, deck.length]
  );

  const restart = useCallback(() => {
    setDeck((d) => [...d].sort(() => Math.random() - 0.5));
    setIndex(0);
    setRevealed(false);
    setScore({ known: 0, unknown: 0 });
    setFinished(false);
  }, []);

  if (!current && !finished) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-500">
              フラッシュカード
            </span>
            <button
              onClick={onExit}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 text-right">
            {index} / {deck.length}
          </p>
        </div>

        {/* Finished screen */}
        {finished ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-4">
              {score.known >= deck.length * 0.8 ? "🎉" : "💪"}
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">完了！</h2>
            <p className="text-slate-500 text-sm mb-6">
              覚えた: {score.known}語 ／ もう少し: {score.unknown}語
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={restart}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Shuffle className="h-4 w-4" />
                もう一度
              </button>
              <button
                onClick={onExit}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                単語帳に戻る
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                  TYPE_CONFIG[current.type]?.color ?? "bg-slate-100 text-slate-600 border-slate-200")}>
                  {TYPE_CONFIG[current.type]?.label ?? current.type}
                </span>
                <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full",
                  CEFR_COLORS[current.cefr_level] ?? "bg-slate-100 text-slate-600")}>
                  {current.cefr_level}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {current.expression}
                </h2>
                <button onClick={handleSpeak}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400">この表現の意味は？</p>
            </div>

            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <Eye className="h-4 w-4" />
                意味を確認する
              </button>
            ) : (
              <div>
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">意味</p>
                  <p className="text-base font-semibold text-slate-800 mb-3">{current.meaning_ja}</p>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">例文</p>
                    <button
                      onClick={() => {
                        if (!("speechSynthesis" in window)) return;
                        window.speechSynthesis.cancel();
                        const u = new SpeechSynthesisUtterance(current.example);
                        u.lang = "en-US"; u.rate = 0.88;
                        window.speechSynthesis.speak(u);
                      }}
                      className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-indigo-700 font-medium">{current.example}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => next(false)}
                    className="py-3 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-600 font-semibold text-sm hover:bg-rose-100 transition-colors">
                    😔 もう少し
                  </button>
                  <button onClick={() => next(true)}
                    className="py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors">
                    😊 覚えた！
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => { setIndex((i) => Math.max(0, i - 1)); setRevealed(false); }}
                disabled={index === 0}
                className="flex items-center gap-1 text-xs text-slate-400 disabled:opacity-30 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />前へ
              </button>
              <button
                onClick={() => { setIndex((i) => Math.min(deck.length - 1, i + 1)); setRevealed(false); }}
                disabled={index >= deck.length - 1}
                className="flex items-center gap-1 text-xs text-slate-400 disabled:opacity-30 hover:text-slate-600 transition-colors"
              >
                次へ<ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function VocabularyPage() {
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();
  const [vocabulary, setVocabulary] = useState<SavedPhrase[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [statusTab, setStatusTab] = useState<'learning' | 'archived'>('learning');
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cefrFilter, setCefrFilter] = useState<string>("all");
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  // /examples 静的データから example_translation を補完するためのルックアップマップ
  const examplesTranslationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const video of EXAMPLES) {
      for (const phrase of video.phrases) {
        if (phrase.example_translation) {
          map.set(phrase.expression.toLowerCase(), phrase.example_translation);
        }
      }
    }
    return map;
  }, []);

  // 単語帳は localStorage から（ログイン済みでも同期はしない — 保存はServer Action経由）
  useEffect(() => {
    const raw = getVocabulary();
    // example_translation が未保存の既存データは /examples 静的データで補完
    const enriched = raw.map((p) =>
      p.example_translation
        ? p
        : { ...p, example_translation: examplesTranslationMap.get(p.expression.toLowerCase()) }
    );
    setVocabulary(enriched);
  }, [examplesTranslationMap]);

  // 解析履歴: ログイン済みは Supabase（Server Action）、未ログインは localStorage
  useEffect(() => {
    if (isSignedIn === undefined) return;
    if (isSignedIn && userId) {
      setLoadingAnalyses(true);
      getUserAnalysesAction().then((analyses) => {
        setSavedAnalyses(analyses);
        setLoadingAnalyses(false);
      });
    } else {
      setSavedAnalyses(getSavedAnalyses());
    }
  }, [isSignedIn, userId]);

  // ─── Derived vocab lists ──────────────────────────────────────────────────

  const learningVocab = useMemo(
    () => vocabulary.filter((p) => !p.status || p.status === 'learning'),
    [vocabulary]
  );
  const archivedVocab = useMemo(
    () => vocabulary.filter((p) => p.status === 'archived'),
    [vocabulary]
  );
  const activeVocab = statusTab === 'learning' ? learningVocab : archivedVocab;

  // Available filter options from activeVocab
  const availableTypes = useMemo(
    () => Array.from(new Set(activeVocab.map((p) => p.type))),
    [activeVocab]
  );
  const availableCefr = useMemo(
    () => ["A1","A2","B1","B2","C1","C2"].filter((l) => activeVocab.some((p) => p.cefr_level === l)),
    [activeVocab]
  );

  // Filtered vocabulary
  const filtered = useMemo(() => {
    return activeVocab.filter((p) => {
      const matchSearch =
        search === "" ||
        p.expression.toLowerCase().includes(search.toLowerCase()) ||
        p.meaning_ja.includes(search);
      const matchType = typeFilter === "all" || p.type === typeFilter;
      const matchCefr = cefrFilter === "all" || p.cefr_level === cefrFilter;
      return matchSearch && matchType && matchCefr;
    });
  }, [activeVocab, search, typeFilter, cefrFilter]);

  // Reset type/cefr filter when switching tabs
  useEffect(() => {
    setTypeFilter("all");
    setCefrFilter("all");
    setSearch("");
  }, [statusTab]);

  const handleDelete = useCallback((id: string, expression: string) => {
    setVocabulary(deletePhrase(id));
    if (isSignedIn) void deleteVocabularyAction(id);
    toast.success(`「${expression}」を削除しました`);
  }, [isSignedIn]);

  const handleArchive = useCallback((id: string, expression: string) => {
    setVocabulary(archivePhrase(id));
    if (isSignedIn) void archiveVocabularyAction(id);
    toast.success(`「${expression}」をマスター済みに移動しました`, {
      description: "MasteredタブでいつでもLearningに戻せます",
    });
  }, [isSignedIn]);

  const handleRestore = useCallback((id: string, expression: string) => {
    setVocabulary(restorePhrase(id));
    if (isSignedIn) void restoreVocabularyAction(id);
    toast.success(`「${expression}」を学習中に戻しました`);
  }, [isSignedIn]);

  const handleClearByStatus = useCallback(() => {
    const updated = clearByStatus(statusTab);
    setVocabulary(updated);
    setShowClearConfirm(false);
    if (isSignedIn) void clearVocabularyAction(statusTab);
    toast.success(statusTab === 'learning' ? "学習中の単語をすべて削除しました" : "マスター済みの単語をすべて削除しました");
  }, [statusTab, isSignedIn]);

  const handleDeleteAnalysis = useCallback(async (id: string) => {
    if (isSignedIn && userId) {
      await deleteUserAnalysisAction(id);
      setSavedAnalyses((prev) => prev.filter((a) => a.id !== id));
    } else {
      deleteSavedAnalysis(id);
      setSavedAnalyses(getSavedAnalyses());
    }
    toast.success("保存した解析結果を削除しました");
  }, [isSignedIn, userId]);

  const handleRestoreAnalysis = useCallback((id: string) => {
    setPendingRestore(id);
    router.push("/");
  }, [router]);

  const handleExportCSV = useCallback(() => {
    if (vocabulary.length === 0) { toast.error("保存された表現がありません"); return; }
    exportToCSV(vocabulary);
    toast.success("CSVをダウンロードしました");
  }, [vocabulary]);

  const handleExportMarkdown = useCallback(() => {
    if (vocabulary.length === 0) { toast.error("保存された表現がありません"); return; }
    exportToMarkdown(vocabulary);
    toast.success("Markdownをダウンロードしました", { description: "Obsidianなどのツールで開けます" });
  }, [vocabulary]);

  return (
    <div className="min-h-screen relative">
      {/* Flashcard overlay — learning only */}
      {showFlashcard && learningVocab.length > 0 && (
        <FlashCard
          cards={filtered.length > 0 && statusTab === 'learning' ? filtered : learningVocab}
          onExit={() => setShowFlashcard(false)}
        />
      )}

      {showCoach && (
        <CoachModal
          vocabulary={learningVocab}
          onClose={() => setShowCoach(false)}
        />
      )}

      <SiteHeader
        maxWidth="5xl"
        right={
          <>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block"
            >
              ← 解析に戻る
            </Link>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
              <BookMarked className="h-3 w-3 inline mr-1" />
              {vocabulary.length}語
            </span>
          </>
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page title + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              マイ単語帳
            </h1>
            {vocabulary.length > 0 ? (
              <div className="text-sm text-slate-400 mt-0.5 space-x-1.5">
                <span>{vocabulary.length}個の表現を保存中</span>
                <span className="text-slate-300">·</span>
                <span>学習中 {learningVocab.length}個</span>
                <span className="text-slate-300">·</span>
                <span>マスター {archivedVocab.length}個</span>
              </div>
            ) : (
              <p className="text-sm text-slate-400 mt-0.5">保存した表現がここに表示されます</p>
            )}
          </div>

          {vocabulary.length > 0 && (
            <div className="flex flex-col items-start sm:items-end gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => learningVocab.length >= MIN_COACH_PHRASES && setShowCoach(true)}
                  disabled={learningVocab.length < MIN_COACH_PHRASES}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm",
                    learningVocab.length >= MIN_COACH_PHRASES
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <Brain className="h-4 w-4" />
                  傾向と対策を分析する
                </button>
                <button
                  onClick={() => setShowFlashcard(true)}
                  disabled={learningVocab.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 rounded-xl text-sm font-semibold text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Eye className="h-4 w-4" />
                  フラッシュカード
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 rounded-xl text-sm font-medium text-slate-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-violet-200 hover:text-violet-600 rounded-xl text-sm font-medium text-slate-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Obsidian
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-rose-200 hover:text-rose-500 rounded-xl text-sm font-medium text-slate-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  全削除
                </button>
              </div>
              {learningVocab.length < MIN_COACH_PHRASES && (
                <p className="text-[11px] text-slate-400">
                  ※ 5個以上の保存でAIコーチが解放されます（現在{learningVocab.length}個）
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── 保存した解析結果 ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-700">保存した解析結果</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {loadingAnalyses ? "読み込み中…" : isSignedIn
                ? `${savedAnalyses.length} 件`
                : `${savedAnalyses.length} / ${ANALYSIS_MAX_SLOTS} 枠`}
            </span>
          </div>

          {loadingAnalyses ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl px-6 py-8 text-center">
              <p className="text-sm text-slate-400">読み込み中...</p>
            </div>
          ) : savedAnalyses.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl px-6 py-8 text-center">
              <p className="text-sm text-slate-400">保存された解析結果はありません</p>
              <p className="text-xs text-slate-300 mt-1">
                {isSignedIn
                  ? "解析結果画面の「この結果を保存」ボタンで保存できます"
                  : "解析結果画面の「この結果を保存」ボタンで最大3件保存できます"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedAnalyses.map((analysis) => {
                const isYt = analysis.data.source_type === "youtube";
                const isWeb = analysis.data.source_type === "web";
                const truncUrl = analysis.sourceUrl
                  ? analysis.sourceUrl.length > 52
                    ? analysis.sourceUrl.slice(0, 49) + "…"
                    : analysis.sourceUrl
                  : null;
                const ytId = analysis.sourceUrl?.match(/[?&]v=([^&]{11})/)?.[1]
                  ?? analysis.sourceUrl?.match(/youtu\.be\/([^?&]{11})/)?.[1];
                return (
                  <div key={analysis.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row sm:items-stretch gap-0">
                    {/* YouTube thumbnail */}
                    {ytId && (
                      <div className="sm:w-32 w-full h-20 sm:h-auto flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {isYt && <Youtube className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                          {isWeb && <Globe className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />}
                          {!isYt && !isWeb && <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
                          <span className="text-xs font-medium text-slate-600 truncate">
                            {truncUrl ?? "テキスト入力"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                          <span className="font-bold text-indigo-600">{analysis.cefrLevel}</span>
                          {analysis.data.overall_level && (
                            <span>→ {analysis.data.overall_level}</span>
                          )}
                          <span>·</span>
                          <span>{analysis.data.total_count}個の表現</span>
                          <span>·</span>
                          <span>{new Date(analysis.savedAt).toLocaleDateString("ja-JP")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => router.push(`/analyses/${analysis.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-100 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          詳細を見る
                        </button>
                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ad placeholder — top */}
        {vocabulary.length > 0 && (
          <AdPlaceholder slot="単語帳トップ · 728×90" className="mb-6" size="sm" />
        )}

        {/* Empty state */}
        {vocabulary.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📖</div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">
              まだ単語が保存されていません
            </h2>
            <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
              解析結果のカードにある「単語帳に保存」ボタンを押すと、ここに表示されます。
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              解析を始める →
            </Link>
          </div>
        )}

        {/* Learning / Mastered tabs + Search + Filters */}
        {vocabulary.length > 0 && (
          <>
            {/* Status tabs */}
            <div className="flex items-center gap-2 mb-5 font-mono">
              <button
                onClick={() => setStatusTab('learning')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  statusTab === 'learning'
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-200 text-slate-500 hover:border-slate-400"
                )}
              >
                Learning ({learningVocab.length})
              </button>
              <button
                onClick={() => setStatusTab('archived')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  statusTab === 'archived'
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-200 text-slate-500 hover:border-slate-400"
                )}
              >
                Mastered ({archivedVocab.length})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="表現・意味で検索..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Type filter */}
            {availableTypes.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    typeFilter === "all"
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  すべて
                </button>
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      typeFilter === type
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {TYPE_CONFIG[type]?.label ?? type}
                  </button>
                ))}
              </div>
            )}

            {/* CEFR filter */}
            {availableCefr.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setCefrFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    cefrFilter === "all"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  全レベル
                </button>
                {availableCefr.map((level) => (
                  <button
                    key={level}
                    onClick={() => setCefrFilter(level)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                      cefrFilter === level
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}

            {(search || typeFilter !== "all" || cefrFilter !== "all") && (
              <p className="text-xs text-slate-400 mb-4">
                {filtered.length}件 表示中
              </p>
            )}

            {/* Empty tab state */}
            {activeVocab.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                {statusTab === 'learning'
                  ? "学習中の表現はありません"
                  : "マスター済みの表現はありません。カードの ✓✓ ボタンで追加できます"}
              </div>
            )}

            {filtered.length === 0 && activeVocab.length > 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                条件に一致する表現が見つかりませんでした
              </div>
            )}

            <div className="space-y-3">
              {filtered.map((phrase, i) => (
                <div key={phrase.id}>
                  {i > 0 && i % 8 === 0 && (
                    <AdPlaceholder
                      slot={`インフィード広告 · 336×280`}
                      size="md"
                      className="mb-3"
                    />
                  )}
                  <VocabCard
                    phrase={phrase}
                    isArchived={phrase.status === 'archived'}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    onRestore={handleRestore}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
              <h3 className="font-bold text-slate-800">
                {statusTab === 'learning' ? '学習中の単語をすべて削除' : 'マスター済みの単語をすべて削除'}
              </h3>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              {statusTab === 'learning'
                ? `学習中の${learningVocab.length}個の表現がすべて削除されます。この操作は元に戻せません。`
                : `マスター済みの${archivedVocab.length}個の表現がすべて削除されます。この操作は元に戻せません。`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleClearByStatus}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
