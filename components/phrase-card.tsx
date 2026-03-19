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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PhraseResult } from "@/lib/types";

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
  onSave: (phrase: PhraseResult) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PhraseCard({ phrase, savedExpressions, dailyRemaining, onSave }: PhraseCardProps) {
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [showDetail,   setShowDetail]   = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [recognized,   setRecognized]   = useState("");
  const [feedback,     setFeedback]     = useState<Feedback | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const saved = savedExpressions.has(phrase.expression.toLowerCase());
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
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    utterance.onend  = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [phrase.expression, isSpeaking]);

  const handleSpeakExample = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase.example);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }, [phrase.example]);

  // ─── 音読練習 ─────────────────────────────────────────────────────────

  const handlePractice = useCallback(() => {
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

  const handleSave = useCallback(() => {
    if (saved) return;
    onSave(phrase);
  }, [saved, phrase, onSave]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* ── Header ── */}
      <div className="p-5 flex-1">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", typeConfig.bg, typeConfig.text, typeConfig.border)}>
            {typeConfig.label}
          </span>
          <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", cefrConfig.bg, cefrConfig.text)}>
            {phrase.cefr_level}
          </span>
        </div>

        {/* Expression + TTS */}
        <div className="flex items-start gap-2 mb-3">
          <h3 className="text-[1.35rem] font-bold text-slate-900 tracking-tight leading-tight flex-1">
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
          <p className="text-xs text-slate-500 leading-relaxed italic">{phrase.context}</p>
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
              {/* Mic */}
              <button
                onClick={handlePractice}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  isListening
                    ? "bg-rose-100 text-rose-500 animate-pulse"
                    : "hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600"
                )}
                title={isListening ? "停止" : "音読練習"}
              >
                {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <p className="text-sm text-indigo-900 font-medium leading-relaxed">{phrase.example}</p>

          {/* Listening indicator */}
          {isListening && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <p className="text-xs text-rose-500 font-medium">Listening...</p>
            </div>
          )}

          {/* Result */}
          {!isListening && recognized && (
            <div className="mt-2 space-y-1">
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
          disabled={saved}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all",
            saved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
              : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
          )}
        >
          {saved ? (
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
