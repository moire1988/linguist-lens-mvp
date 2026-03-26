"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  BookmarkPlus,
  Quote,
  ChevronDown,
  Check,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, getBestEnglishVoice } from "@/lib/utils";
import { getSettings, ACCENT_LANG } from "@/lib/settings";
import type { PhraseResult } from "@/lib/types";
import { TranslationAccordion } from "@/components/translation-accordion";
import { useAppAuth } from "@/hooks/useAppAuth";
import { openLoginPrompt } from "@/lib/login-prompt-store";

// ─── Web Speech API types ────────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: { isFinal: boolean; [i: number]: { transcript: string } }[];
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
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

// ─── Scoring ─────────────────────────────────────────────────────────────────

type Feedback = "excellent" | "passed" | "retry";

function evaluate(recognized: string, example: string, expression: string): Feedback {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const recSet = new Set(norm(recognized));
  const exWords = norm(example);
  const targetWords = norm(expression);

  const exOverlap = exWords.length
    ? exWords.filter((w) => recSet.has(w)).length / exWords.length
    : 0;
  const targetOverlap = targetWords.length
    ? targetWords.filter((w) => recSet.has(w)).length / targetWords.length
    : 0;

  if (exOverlap >= 0.75) return "excellent";
  if (targetOverlap >= 0.6) return "passed";
  return "retry";
}

// ─── Word-level diff ─────────────────────────────────────────────────────────

// When speech recognition expands contractions (e.g. "don't" → "do not"),
// check the expansion words against the recognized set instead.
const EXPAND: Record<string, string[]> = {
  im: ["i","am"], ive: ["i","have"], id: ["i","would"], ill: ["i","will"],
  youre: ["you","are"], youve: ["you","have"], youll: ["you","will"], youd: ["you","would"],
  hes: ["he","is"], shes: ["she","is"], shell: ["she","will"],
  its: ["it","is"], weve: ["we","have"],
  theyre: ["they","are"], theyve: ["they","have"], theyll: ["they","will"],
  dont: ["do","not"], doesnt: ["does","not"], didnt: ["did","not"],
  cant: ["can","not"], wont: ["will","not"], couldnt: ["could","not"],
  wouldnt: ["would","not"], shouldnt: ["should","not"],
  isnt: ["is","not"], arent: ["are","not"], wasnt: ["was","not"],
  werent: ["were","not"], havent: ["have","not"], hasnt: ["has","not"], hadnt: ["had","not"],
};

// Simple suffix stemmer to handle -ing/-ed/-es/-s variations
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

  const tokens = example.split(/(\s+)/);
  return tokens.map((token, i) => {
    if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
    const n = norm(token);
    if (!n) return <span key={i}>{token}</span>;

    const matched =
      recSet.has(n) ||
      // stem match: handles -ing/-ed/-s recognition variations
      (n.length >= 5 && recStems.has(stemWord(n))) ||
      // contraction expansion: "don't" → ["do","not"] all present in recognized
      (EXPAND[n] !== undefined && EXPAND[n].every((w) => recSet.has(w)));

    return (
      <span
        key={i}
        className={matched ? "text-emerald-600 font-bold" : "text-rose-500 font-bold underline decoration-dotted"}
      >
        {token}
      </span>
    );
  });
}

const FEEDBACK_CONFIG: Record<Feedback, { label: string; className: string }> = {
  excellent: { label: "Excellent! ✨", className: "text-emerald-600" },
  passed:    { label: "Passed! ✅",    className: "text-blue-600"    },
  retry:     { label: "Try again 🔄", className: "text-amber-600"   },
};

// ─── Type/CEFR config ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  phrasal_verb:   { label: "句動詞",       bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
  idiom:          { label: "イディオム",   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
  collocation:    { label: "コロケーション", bg: "bg-sky-50",   text: "text-sky-700",     border: "border-sky-200"     },
  grammar_pattern:{ label: "文法パターン", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

const CEFR_CONFIG: Record<string, { bg: string; text: string }> = {
  A1: { bg: "bg-slate-100",  text: "text-slate-600"  },
  A2: { bg: "bg-green-100",  text: "text-green-700"  },
  B1: { bg: "bg-blue-100",   text: "text-blue-700"   },
  B2: { bg: "bg-indigo-100", text: "text-indigo-700" },
  C1: { bg: "bg-purple-100", text: "text-purple-700" },
  C2: { bg: "bg-rose-100",   text: "text-rose-700"   },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface PhraseCardProps {
  phrase: PhraseResult;
  savedExpressions: Set<string>;
  dailyRemaining: number;
  onSave: (phrase: PhraseResult) => void | Promise<void>;
  /** 保存リクエスト中の表現キー（小文字） */
  savingExpressionKey?: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PhraseCard({
  phrase,
  savedExpressions,
  dailyRemaining,
  onSave,
  savingExpressionKey = null,
}: PhraseCardProps) {
  const { isSignedIn } = useAppAuth();
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [showDetail,   setShowDetail]   = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [recognized,   setRecognized]   = useState("");
  const [feedback,     setFeedback]     = useState<Feedback | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const exprKey = phrase.expression.toLowerCase();
  const saved = savedExpressions.has(exprKey);
  const isSavingThis = savingExpressionKey === exprKey;
  const typeConfig = TYPE_CONFIG[phrase.type] ?? TYPE_CONFIG.phrasal_verb;
  const cefrConfig = CEFR_CONFIG[phrase.cefr_level] ?? CEFR_CONFIG.B2;

  // Stop recognition on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  // ─── TTS ──────────────────────────────────────────────────────────────

  const handleSpeak = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      toast.error("このブラウザは音声読み上げに対応していません");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(phrase.expression);
    const { accent } = getSettings();
    utterance.lang = ACCENT_LANG[accent];
    utterance.rate = 0.82;
    const voice = getBestEnglishVoice(accent);
    if (voice) utterance.voice = voice;
    utterance.onend  = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [phrase.expression, isSpeaking]);

  const handleSpeakExample = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase.example);
    const { accent } = getSettings();
    utterance.lang = ACCENT_LANG[accent];
    utterance.rate = 0.88;
    const voice = getBestEnglishVoice(accent);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, [phrase.example]);

  // ─── 音読練習 ─────────────────────────────────────────────────────────

  const handlePractice = useCallback(() => {
    if (!isSignedIn) {
      openLoginPrompt("practice");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("音声認識はChrome / Edgeでご利用ください");
      return;
    }

    // 録音中なら停止
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    setRecognized("");
    setFeedback(null);

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setRecognized(text);
      setFeedback(evaluate(text, phrase.example, phrase.expression));
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [isListening, phrase.example, phrase.expression]);

  // ─── 単語帳に保存 ─────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (saved || isSavingThis) return;
    if (!isSignedIn) {
      openLoginPrompt("save");
      return;
    }
    await Promise.resolve(onSave(phrase));
  }, [saved, isSavingThis, isSignedIn, phrase, onSave]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-violet-100/60 shadow-sm hover:shadow-md hover:shadow-violet-100/50 hover:border-violet-200/80 transition-all duration-200 overflow-hidden flex flex-col">
      {/* ── Header ── */}
      <div className="p-5 flex-1">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <span className={cn("text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border", typeConfig.bg, typeConfig.text, typeConfig.border)}>
            {typeConfig.label}
          </span>
          <span className={cn("text-xs font-mono font-bold px-2.5 py-0.5 rounded-full", cefrConfig.bg, cefrConfig.text)}>
            {phrase.cefr_level}
          </span>
        </div>

        {/* Expression + TTS */}
        <div className="flex items-start gap-2 mb-3">
          <h3 className="text-[1.35rem] font-extrabold text-slate-900 tracking-tight leading-tight flex-1">
            {phrase.expression}
          </h3>
          <button
            onClick={handleSpeak}
            className={cn(
              "flex-shrink-0 p-2 rounded-xl transition-all mt-0.5",
              isSpeaking
                ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-200"
                : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            )}
            title={isSpeaking ? "停止" : "発音を聞く"}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Context */}
        <div className="flex gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
          <Quote className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 leading-relaxed italic">{phrase.context}</p>
            {phrase.context_translation && (
              <TranslationAccordion text={phrase.context_translation} variant="slate" />
            )}
          </div>
        </div>

        {/* Meaning */}
        <div className="mb-3.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">意味</p>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{phrase.meaning_ja}</p>
        </div>

        {/* Nuance */}
        <div className="mb-3.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ニュアンス解説</p>
          <p className="text-sm text-slate-600 leading-relaxed">{phrase.nuance}</p>
        </div>

        {/* Example + 音読練習 */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">例文</p>
            <div className="flex items-center gap-1">
              {/* TTS */}
              <button
                onClick={handleSpeakExample}
                className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
                title="例文を読み上げ"
              >
                <Volume2 className="h-3 w-3" />
              </button>
              {/* Practice button */}
              <button
                onClick={handlePractice}
                className={cn(
                  "flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors",
                  isListening
                    ? "bg-rose-100 text-rose-500 animate-pulse"
                    : "hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600"
                )}
                title={isListening ? "停止" : "音読練習"}
              >
                {isListening
                  ? <><MicOff className="h-3 w-3" /> Stop</>
                  : <><Mic className="h-3 w-3" /> Practice</>
                }
              </button>
            </div>
          </div>

          <p className="text-sm text-indigo-900 font-medium leading-relaxed">{phrase.example}</p>

          {phrase.example_translation && (
            <TranslationAccordion text={phrase.example_translation} variant="indigo" />
          )}

          {/* Listening indicator */}
          {isListening && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-xs text-rose-500 font-medium">Listening...</p>
            </div>
          )}

          {/* Result */}
          {!isListening && recognized && (
            <div className="mt-2 space-y-1.5">
              {/* diff: example with per-word coloring */}
              <p className="text-sm leading-relaxed">
                {renderExampleDiff(recognized, phrase.example)}
              </p>
              <p className="text-[11px] text-indigo-400 italic leading-relaxed">
                「{recognized}」
              </p>
              {feedback && (
                <p className={cn("text-xs font-bold", FEEDBACK_CONFIG[feedback].className)}>
                  {FEEDBACK_CONFIG[feedback].label}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 学習のポイント（展開） ── */}
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

      {/* ── 単語帳に保存 ── */}
      <div className="px-5 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={handleSave}
          disabled={saved || isSavingThis}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all",
            saved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
              : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm"
          )}
        >
          {isSavingThis ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              保存中…
            </>
          ) : saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              単語帳に保存済み
            </>
          ) : (
            <>
              <BookmarkPlus className="h-3.5 w-3.5" />
              単語帳に保存
              {dailyRemaining <= 2 && dailyRemaining > 0 && (
                <span className="ml-auto text-[10px] text-amber-500 font-semibold">
                  本日あと{dailyRemaining}件
                </span>
              )}
              {dailyRemaining === 0 && (
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
