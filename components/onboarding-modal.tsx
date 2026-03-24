"use client";

import { useEffect, useState } from "react";
import { Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Accent, CefrLevel } from "@/lib/settings";

interface OnboardingModalProps {
  initialLevel: CefrLevel;
  initialAccent: Accent;
  onStart: (payload: { level: CefrLevel; accent: Accent }) => void;
}

const ACCENTS: { value: Accent; label: string; sublabel: string; flag: string }[] = [
  { value: "US", label: "US", sublabel: "American", flag: "🇺🇸" },
  { value: "UK", label: "UK", sublabel: "British", flag: "🇬🇧" },
  { value: "AU", label: "AU", sublabel: "Australian", flag: "🇦🇺" },
];

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_HINT: Record<CefrLevel, string> = {
  A1: "挨拶程度",
  A2: "短いやりとり",
  B1: "日常会話",
  B2: "議論に参加",
  C1: "ビジネス対応",
  C2: "ほぼネイティブ",
};

// トップページ（app/page.tsx）の CEFR 基準と同一のスコア帯
const LEVEL_SCORE_GUIDE: Record<CefrLevel, { toeic: string | null; toefl: string | null }> = {
  A1: { toeic: "〜225", toefl: null },
  A2: { toeic: "225〜549", toefl: null },
  B1: { toeic: "550〜780", toefl: "42〜71" },
  B2: { toeic: "785〜940", toefl: "72〜94" },
  C1: { toeic: "945〜990", toefl: "95〜120" },
  C2: { toeic: null, toefl: null },
};

const ACCENT_SAMPLE_TEXT =
  "Hi there! Let's find some natural English expressions together.";

const ACCENT_LANG: Record<Accent, string> = {
  US: "en-US",
  UK: "en-GB",
  AU: "en-AU",
};

export function OnboardingModal({
  initialLevel,
  initialAccent,
  onStart,
}: OnboardingModalProps) {
  const [level, setLevel] = useState<CefrLevel>(initialLevel);
  const [accent, setAccent] = useState<Accent>(initialAccent);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setIsReady(true), 20);
    return () => {
      window.clearTimeout(id);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playAccentSample = (targetAccent: Accent) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(ACCENT_SAMPLE_TEXT);
    utter.lang = ACCENT_LANG[targetAccent];
    utter.rate = 0.98;
    utter.pitch = 1.02;
    synth.speak(utter);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-[1.5px]" />
      <div className="fixed inset-0 z-[60] grid place-items-center px-4">
        <div
          className={cn(
            "w-full max-w-xl rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_22px_70px_rgba(15,23,42,0.20)]",
            "transition-all duration-300 ease-out",
            isReady ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-indigo-500">
                Onboarding
              </p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-800">
                あなたに最適な表現を抽出するために
              </h2>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-400">
              <X className="h-4 w-4" />
            </span>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div>
              <p className="mb-2.5 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                学習中のレベルを教えて下さい
              </p>
              <p className="mb-2 text-[10px] text-slate-400">（CEFR準拠）</p>
              <div className="grid grid-cols-6 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "rounded-lg border px-2 py-2.5 text-center transition-colors",
                      level === l
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-800"
                    )}
                  >
                    <p className="text-xs font-mono font-extrabold leading-none">{l}</p>
                    <p className="mt-1 text-[9px] leading-tight opacity-85">{LEVEL_HINT[l]}</p>
                  </button>
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] text-slate-500">
                {LEVEL_SCORE_GUIDE[level].toeic && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">
                    TOEIC: {LEVEL_SCORE_GUIDE[level].toeic}
                  </span>
                )}
                {LEVEL_SCORE_GUIDE[level].toefl && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">
                    TOEFL iBT: {LEVEL_SCORE_GUIDE[level].toefl}
                  </span>
                )}
                {!LEVEL_SCORE_GUIDE[level].toeic && !LEVEL_SCORE_GUIDE[level].toefl && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5">
                    ネイティブ近傍レベル
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                優先したいアクセント
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAccent(a.value)}
                    className={cn(
                      "rounded-xl border px-3.5 py-3.5 text-left transition-colors",
                      accent === a.value
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={cn(
                            "text-sm font-mono font-semibold",
                            accent === a.value ? "text-indigo-700" : "text-slate-700"
                          )}
                        >
                          {a.flag} {a.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{a.sublabel}</p>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          playAccentSample(a.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            playAccentSample(a.value);
                          }
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:text-indigo-600 hover:border-indigo-200"
                        title={`${a.value} accent sample`}
                        aria-label={`${a.value} accent sample`}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onStart({ level, accent })}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-sm font-semibold text-white transition-all",
                "border-indigo-400/70 bg-gradient-to-r from-violet-500 to-blue-500",
                "hover:from-violet-600 hover:to-blue-600 hover:shadow-[0_8px_22px_rgba(99,102,241,0.35)]"
              )}
            >
              ✨ あなたに最適なLinguistLensをはじめる
            </button>

            <p className="text-center text-[10px] leading-relaxed text-slate-500">
              ※後から右上の設定(⚙️)でいつでも変更できます
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
