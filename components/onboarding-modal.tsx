"use client";

import { useEffect, useState } from "react";
import { Volume2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Accent, CefrLevel } from "@/lib/settings";
import { useClerk } from "@clerk/nextjs";

/* ─── Props ──────────────────────────────────────────────── */

interface OnboardingModalProps {
  initialLevel: CefrLevel;
  initialAccent: Accent;
  onStart: (payload: { level: CefrLevel; accent: Accent }) => void;
}

/* ─── Constants ──────────────────────────────────────────── */

const ACCENTS: { value: Accent; label: string; sublabel: string; flag: string }[] = [
  { value: "US", label: "US", sublabel: "American",   flag: "🇺🇸" },
  { value: "UK", label: "UK", sublabel: "British",    flag: "🇬🇧" },
  { value: "AU", label: "AU", sublabel: "Australian", flag: "🇦🇺" },
];

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_HINT: Record<CefrLevel, string> = {
  A1: "挨拶程度", A2: "短いやりとり", B1: "日常会話",
  B2: "議論に参加", C1: "ビジネス対応", C2: "ほぼネイティブ",
};

const LEVEL_SCORE_GUIDE: Record<CefrLevel, { toeic: string | null; toefl: string | null }> = {
  A1: { toeic: "〜225",     toefl: null },
  A2: { toeic: "225〜549",  toefl: null },
  B1: { toeic: "550〜780",  toefl: "42〜71" },
  B2: { toeic: "785〜940",  toefl: "72〜94" },
  C1: { toeic: "945〜990",  toefl: "95〜120" },
  C2: { toeic: null,        toefl: null },
};

const ACCENT_SAMPLE_TEXT = "Hi there! Let's find some natural English expressions together.";
const ACCENT_LANG: Record<Accent, string> = { US: "en-US", UK: "en-GB", AU: "en-AU" };

/* ─── Demo panel ─────────────────────────────────────────── */

const DEMO_URL = "https://youtu.be/dQw4w9WgXcQ";
type DemoPhase = "idle" | "typing" | "clicking" | "loading" | "result";

const DEMO_EXPRESSIONS = [
  { phrase: "come to terms with", meaning: "〜を受け入れる・折り合いをつける" },
  { phrase: "open up to",         meaning: "〜に心を開く・本音を話す" },
];

const PHASE_DOTS: DemoPhase[] = ["idle", "typing", "loading", "result"];

function DemoPanel() {
  const [phase,    setPhase]    = useState<DemoPhase>("idle");
  const [typedUrl, setTypedUrl] = useState("");
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

    const run = async () => {
      while (!cancelled) {
        /* reset */
        setPhase("idle"); setTypedUrl(""); setShowCard(false);
        await sleep(700);
        if (cancelled) return;

        /* typing */
        setPhase("typing");
        for (let i = 1; i <= DEMO_URL.length; i++) {
          if (cancelled) return;
          setTypedUrl(DEMO_URL.slice(0, i));
          await sleep(65);
        }
        if (cancelled) return;
        await sleep(450);

        /* button click */
        setPhase("clicking");
        await sleep(260);
        if (cancelled) return;

        /* loading */
        setPhase("loading");
        await sleep(1700);
        if (cancelled) return;

        /* result */
        setPhase("result");
        setShowCard(true);
        await sleep(2500);
        if (cancelled) return;

        setShowCard(false);
        await sleep(400);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl bg-gradient-to-b from-slate-50 to-white p-4">
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-indigo-400">
        How it works
      </p>

      {/* URL input */}
      <div className="flex min-h-[36px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <span className="text-[11px] text-slate-300">🔗</span>
        <span className="flex-1 truncate font-mono text-[11px] text-slate-600 min-w-0">
          {typedUrl.length > 0
            ? typedUrl
            : <span className="text-slate-300">URLを貼り付け...</span>
          }
        </span>
        {(phase === "idle" || phase === "typing") && (
          <span className="h-3.5 w-px animate-pulse bg-indigo-400 rounded-full" />
        )}
      </div>

      {/* Generate button */}
      <button
        tabIndex={-1}
        className={cn(
          "w-full rounded-lg py-2 text-[11px] font-semibold text-white shadow-sm",
          "bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-150",
          phase === "clicking" ? "scale-[0.96] opacity-70" : ""
        )}
      >
        <span className="flex items-center justify-center gap-1.5">
          {phase === "loading" ? (
            <><Loader2 className="h-3 w-3 animate-spin" />解析中...</>
          ) : (
            <><Sparkles className="h-3 w-3" />AIで表現を抽出する</>
          )}
        </span>
      </button>

      {/* Result card — always in DOM to keep stable height */}
      <div
        className={cn(
          "flex-1 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm",
          "transition-all duration-500 ease-out",
          showCard
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-5 pointer-events-none"
        )}
      >
        <div className="mb-2.5 flex items-center gap-1.5">
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-600">
            ⚡ TED Talk
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[9px] text-slate-500">
            B2
          </span>
        </div>
        <p className="mb-2.5 text-[11px] font-semibold leading-snug text-slate-700">
          "The Power of Vulnerability"
        </p>
        <div className="space-y-1.5">
          {DEMO_EXPRESSIONS.map((e) => (
            <div key={e.phrase} className="rounded-md bg-indigo-50/60 px-2.5 py-1.5">
              <p className="font-mono text-[10px] font-semibold text-indigo-700">{e.phrase}</p>
              <p className="mt-0.5 text-[9px] text-slate-500">{e.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Phase indicator dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {PHASE_DOTS.map((p) => (
          <span
            key={p}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              phase === p || (phase === "clicking" && p === "typing")
                ? "w-4 bg-indigo-400"
                : "w-1 bg-slate-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Google icon ────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/* ─── Main modal ─────────────────────────────────────────── */

export function OnboardingModal({
  initialLevel,
  initialAccent,
  onStart,
}: OnboardingModalProps) {
  const [level,   setLevel]   = useState<CefrLevel>(initialLevel);
  const [accent,  setAccent]  = useState<Accent>(initialAccent);
  const [isReady, setIsReady] = useState(false);
  const { openSignIn } = useClerk();

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
    utter.lang  = ACCENT_LANG[targetAccent];
    utter.rate  = 0.98;
    utter.pitch = 1.02;
    synth.speak(utter);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-[1.5px]" />

      {/* Scroll container */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-4 py-6">
        <div
          className={cn(
            "w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white",
            "text-slate-900 shadow-[0_22px_70px_rgba(15,23,42,0.20)]",
            "transition-all duration-300 ease-out",
            isReady ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-indigo-500">
              Onboarding
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-800">
              あなたに最適な表現を抽出するために
            </h2>
          </div>

          {/* 2-column body */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

            {/* ── Left: Demo animation ── */}
            <div className="p-5">
              <DemoPanel />
            </div>

            {/* ── Right: Settings ── */}
            <div className="flex flex-col gap-4 p-5">

              {/* Level */}
              <div>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                  学習レベル
                  <span className="ml-1 font-sans normal-case tracking-normal text-slate-400">
                    （CEFR準拠）
                  </span>
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={cn(
                        "rounded-lg border px-1 py-2.5 text-center transition-colors",
                        level === l
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-800"
                      )}
                    >
                      <p className="font-mono text-xs font-extrabold leading-none">{l}</p>
                      <p className="mt-1 text-[8px] leading-tight opacity-85">{LEVEL_HINT[l]}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {LEVEL_SCORE_GUIDE[level].toeic && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      TOEIC: {LEVEL_SCORE_GUIDE[level].toeic}
                    </span>
                  )}
                  {LEVEL_SCORE_GUIDE[level].toefl && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      TOEFL iBT: {LEVEL_SCORE_GUIDE[level].toefl}
                    </span>
                  )}
                  {!LEVEL_SCORE_GUIDE[level].toeic && !LEVEL_SCORE_GUIDE[level].toefl && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      ネイティブ近傍レベル
                    </span>
                  )}
                </div>
              </div>

              {/* Accent */}
              <div>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                  優先アクセント
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAccent(a.value)}
                      className={cn(
                        "rounded-xl border px-2 py-3 text-left transition-colors",
                        accent === a.value
                          ? "border-indigo-500 bg-indigo-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <p className={cn(
                            "font-mono text-sm font-semibold",
                            accent === a.value ? "text-indigo-700" : "text-slate-700"
                          )}>
                            {a.flag} {a.label}
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-500">{a.sublabel}</p>
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); playAccentSample(a.value); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              playAccentSample(a.value);
                            }
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-indigo-200 hover:text-indigo-600"
                          aria-label={`${a.value} accent sample`}
                        >
                          <Volume2 className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Google login */}
              <button
                type="button"
                onClick={() =>
                  openSignIn({
                    redirectUrl: typeof window !== "undefined" ? window.location.href : "/",
                  })
                }
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <GoogleIcon />
                Googleでログイン / 連携
              </button>

              {/* Start */}
              <button
                type="button"
                onClick={() => onStart({ level, accent })}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-sm font-semibold text-white transition-all",
                  "border-indigo-400/70 bg-gradient-to-r from-violet-500 to-blue-500",
                  "hover:from-violet-600 hover:to-blue-600 hover:shadow-[0_8px_22px_rgba(99,102,241,0.35)]"
                )}
              >
                ✨ あなただけのLinguistLensをはじめる
              </button>

              <p className="text-center text-[10px] text-slate-400">
                ※後から右上の設定(⚙️)でいつでも変更できます
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
