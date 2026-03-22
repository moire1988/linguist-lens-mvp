"use client";

import { useState, useRef } from "react";
import { useClerk } from "@clerk/nextjs";
import { useEffectiveAuth } from "@/lib/dev-auth";
import {
  Volume2, VolumeX, BookmarkPlus, Check,
  Mic, MicOff, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn, getBestEnglishVoice } from "@/lib/utils";
import { getSettings, ACCENT_LANG } from "@/lib/settings";
import type { PhraseResult } from "@/lib/types";

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
  const exOverlap  = norm(example).filter((w) => recSet.has(w)).length / (norm(example).length  || 1);
  const tgtOverlap = norm(expression).filter((w) => recSet.has(w)).length / (norm(expression).length || 1);
  if (exOverlap  >= 0.75) return "excellent";
  if (tgtOverlap >= 0.6)  return "passed";
  return "retry";
}

function renderDiff(recognized: string, example: string) {
  const norm   = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const recSet = new Set(
    recognized.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean)
  );
  return example.split(/(\s+)/).map((token, i) => {
    if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
    const matched = recSet.has(norm(token));
    return (
      <span
        key={i}
        className={
          matched
            ? "text-emerald-600 font-bold"
            : "text-rose-500 font-bold underline decoration-dotted"
        }
      >
        {token}
      </span>
    );
  });
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const CEFR_CONFIG: Record<string, { bg: string; text: string }> = {
  A1: { bg: "bg-slate-100",  text: "text-slate-600"  },
  A2: { bg: "bg-green-100",  text: "text-green-700"  },
  B1: { bg: "bg-blue-100",   text: "text-blue-700"   },
  B2: { bg: "bg-indigo-100", text: "text-indigo-700" },
  C1: { bg: "bg-purple-100", text: "text-purple-700" },
  C2: { bg: "bg-rose-100",   text: "text-rose-700"   },
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PhrasePopupProps {
  phrase: PhraseResult;
  isSaved: boolean;
  dailyRemaining: number;
  top: number;
  left: number;
  onSave: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PhrasePopup({
  phrase, isSaved, dailyRemaining, top, left,
  onSave, onMouseEnter, onMouseLeave,
}: PhrasePopupProps) {
  const { isSignedIn } = useEffectiveAuth();
  const { openSignIn } = useClerk();
  const [isSpeakingWord, setIsSpeakingWord] = useState(false);
  const [isListening,    setIsListening]    = useState(false);
  const [recognized,     setRecognized]     = useState("");
  const [feedback,       setFeedback]       = useState<Feedback | null>(null);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  const cefrCfg = CEFR_CONFIG[phrase.cefr_level] ?? CEFR_CONFIG.B2;
  const safeLeft = typeof window !== "undefined"
    ? Math.max(8, Math.min(left, window.innerWidth - 312))
    : left;

  const speakText = (text: string, rate = 0.85) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const { accent } = getSettings();
    u.lang = ACCENT_LANG[accent] ?? "en-US";
    u.rate = rate;
    const v = getBestEnglishVoice(accent);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };

  const handleSpeakWord = () => {
    if (isSpeakingWord) { window.speechSynthesis.cancel(); setIsSpeakingWord(false); return; }
    speakText(phrase.expression, 0.82);
    setIsSpeakingWord(true);
    window.speechSynthesis.addEventListener("end", () => setIsSpeakingWord(false), { once: true });
  };

  const handleSpeakExample = () => speakText(phrase.example, 0.88);

  const handlePractice = () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { toast.error("音声認識はChrome / Edgeでご利用ください"); return; }
    if (isListening) { recRef.current?.stop(); return; }
    setRecognized(""); setFeedback(null);
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setRecognized(t);
      setFeedback(evaluate(t, phrase.example, phrase.expression));
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recRef.current = rec; rec.start(); setIsListening(true);
  };

  return (
    <div
      data-phrase-popup
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: "fixed", top, left: safeLeft, zIndex: 60, width: 300 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
    >
      {isSignedIn ? (
        <>
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", cefrCfg.bg, cefrCfg.text)}>
                {phrase.cefr_level}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <p className="text-[1.15rem] font-bold text-slate-900 leading-tight flex-1">
                {phrase.expression}
              </p>
              <button
                onClick={handleSpeakWord}
                className={cn(
                  "flex-shrink-0 p-1.5 rounded-xl transition-all mt-0.5",
                  isSpeakingWord
                    ? "bg-indigo-100 text-indigo-600"
                    : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                )}
                title={isSpeakingWord ? "停止" : "発音を聞く"}
              >
                {isSpeakingWord
                  ? <VolumeX className="h-3.5 w-3.5" />
                  : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-700 mt-1">{phrase.meaning_ja}</p>
          </div>

          {/* Nuance */}
          {phrase.nuance && (
            <div className="mx-4 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ニュアンス</p>
              <p className="text-xs text-slate-600 leading-relaxed">{phrase.nuance}</p>
            </div>
          )}

          {/* Example */}
          {phrase.example && (
            <div className="mx-4 mb-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">例文</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSpeakExample}
                    className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
                    title="例文を読み上げ"
                  >
                    <Volume2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handlePractice}
                    className={cn(
                      "flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors",
                      isListening
                        ? "bg-rose-100 text-rose-500 animate-pulse"
                        : "hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600"
                    )}
                  >
                    {isListening
                      ? <><MicOff className="h-3 w-3" /> Stop</>
                      : <><Mic className="h-3 w-3" /> Practice</>}
                  </button>
                </div>
              </div>
              <p className="text-xs text-indigo-900 font-medium leading-relaxed">{phrase.example}</p>
              {isListening && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <p className="text-xs text-rose-500 font-medium">Listening...</p>
                </div>
              )}
              {!isListening && recognized && (
                <div className="mt-1.5 space-y-1">
                  <p className="text-xs leading-relaxed">{renderDiff(recognized, phrase.example)}</p>
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
              disabled={isSaved || dailyRemaining === 0}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all",
                isSaved
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                  : dailyRemaining === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
              )}
            >
              {isSaved
                ? <><Check className="h-3.5 w-3.5" /> 保存済み</>
                : <><BookmarkPlus className="h-3.5 w-3.5" /> 単語帳に保存</>}
              {!isSaved && dailyRemaining <= 2 && dailyRemaining > 0 && (
                <span className="ml-auto text-[10px] text-amber-500 font-semibold">
                  本日あと{dailyRemaining}件
                </span>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="p-4 flex items-center gap-2.5 text-slate-500">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs">ログインすると意味・例文・発音が表示されます</p>
          <button
            onClick={() => openSignIn()}
            className="ml-auto shrink-0 text-xs text-indigo-500 hover:text-indigo-700 font-semibold"
          >
            ログイン
          </button>
        </div>
      )}

      {/* Upward arrow */}
      <div className="absolute bottom-full left-5 -mb-px border-4 border-transparent border-b-white drop-shadow-[0_-1px_0_rgba(0,0,0,0.06)]" />
    </div>
  );
}
