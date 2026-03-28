"use client";

import { useState, useEffect } from "react";
import {
  BookmarkPlus,
  Check,
  Loader2,
  Lightbulb,
  CalendarDays,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getTodaysPhrase } from "@/lib/daily-phrase";
import { savePhrase } from "@/lib/vocabulary";
import { saveVocabularyAction } from "@/app/actions/vocabulary";
import { trackPhraseSaved } from "@/lib/analytics";
import { useAccentLang } from "@/hooks/use-accent-lang";
import { isSpeechSynthesisSupported, speakEnglish } from "@/lib/speech";
import type { ExpressionType } from "@/lib/types";

const LEVEL_COLOR: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  A1: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" },
  A2: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  B1: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  B2: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  C1: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  C2: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

const TYPE_LABEL: Record<ExpressionType, string> = {
  phrasal_verb: "句動詞",
  idiom: "イディオム",
  collocation: "コロケーション",
  grammar_pattern: "文法パターン",
};

export function PhraseOfTheDay() {
  const phrase = getTodaysPhrase();
  const { isSignedIn, isLoaded } = useAuth();
  const { lang: speakLang, accent: accentLabel } = useAccentLang();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ttsMounted, setTtsMounted] = useState(false);

  useEffect(() => {
    setTtsMounted(true);
  }, []);

  const lvCfg = LEVEL_COLOR[phrase.level] ?? LEVEL_COLOR.B2;

  const handleSpeak = () => {
    if (!isSpeechSynthesisSupported()) {
      toast.error("このブラウザは音声読み上げに対応していません");
      return;
    }
    speakEnglish(phrase.expression, speakLang);
  };

  const handleSpeakExample = () => {
    if (!isSpeechSynthesisSupported()) {
      toast.error("このブラウザは音声読み上げに対応していません");
      return;
    }
    speakEnglish(phrase.goodExample, speakLang);
  };

  const handleSave = async () => {
    if (saved || saving || !isLoaded) return;

    if (isSignedIn) {
      setSaving(true);
      try {
        const result = await saveVocabularyAction({
          expression: phrase.expression,
          type: phrase.type,
          cefr_level: phrase.level,
          meaning_ja: phrase.meaning_ja,
          nuance: phrase.nuance,
          example: phrase.goodExample,
          example_translation: phrase.goodExampleJa,
          context: phrase.context,
          why_hard_for_japanese: phrase.why_hard_for_japanese,
          status: "learning",
        });
        if (result.success) {
          setSaved(true);
          toast.success("保存しました");
          trackPhraseSaved({
            expression: phrase.expression,
            type: phrase.type,
            cefr_level: phrase.level,
            source: "daily_phrase",
          });
        } else if (result.reason === "duplicate") {
          setSaved(true);
          toast.info("すでに保存済みです");
        } else {
          toast.error(result.error ?? "保存できませんでした");
        }
      } finally {
        setSaving(false);
      }
      return;
    }

    const result = savePhrase({
      expression: phrase.expression,
      type: phrase.type,
      cefr_level: phrase.level,
      meaning_ja: phrase.meaning_ja,
      nuance: phrase.nuance,
      example: phrase.goodExample,
      example_translation: phrase.goodExampleJa,
      context: phrase.context,
      why_hard_for_japanese: phrase.why_hard_for_japanese,
    });
    if (result.success) {
      setSaved(true);
      toast.success("保存しました");
      trackPhraseSaved({
        expression: phrase.expression,
        type: phrase.type,
        cefr_level: phrase.level,
        source: "daily_phrase",
      });
    } else if (result.reason === "duplicate") {
      setSaved(true);
      toast.info("すでに保存済みです");
    } else if (result.reason === "limit_reached") {
      toast.error("本日の保存上限に達しました");
    } else {
      toast.error("保存できませんでした");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/80">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-indigo-50/80 px-5 py-3 text-indigo-700">
        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-xs font-bold tracking-wide">今日のフレーズ</span>
      </div>

      <div className="bg-white px-5 pb-2 pt-3">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={cn(
              "text-[10px] font-mono font-bold px-2 py-0.5 rounded border",
              lvCfg.bg,
              lvCfg.text,
              lvCfg.border
            )}
          >
            {phrase.level}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-white text-slate-500 border-slate-200">
            {TYPE_LABEL[phrase.type]}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3 mb-0.5">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight min-w-0 flex-1">
            {phrase.expression}
          </h2>
          {ttsMounted && isSpeechSynthesisSupported() && (
            <button
              type="button"
              onClick={handleSpeak}
              className={cn(
                "shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2",
                "text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/80 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
              )}
              aria-label={`「${phrase.expression}」を読み上げ`}
              title={`読み上げ（${accentLabel} · ${speakLang}）`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-4">{phrase.meaning_ja}</p>

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-indigo-100/60 border border-indigo-200/50 mb-4">
          <Lightbulb
            className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0"
            aria-hidden
          />
          <p className="text-xs text-indigo-800 font-medium leading-relaxed">
            <span className="font-bold text-indigo-500 font-mono mr-1">CORE</span>
            {phrase.coreImage}
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/90 p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              例文
            </p>
            {ttsMounted && isSpeechSynthesisSupported() && (
              <button
                type="button"
                onClick={handleSpeakExample}
                className={cn(
                  "shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5",
                  "text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/80 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                )}
                aria-label="例文を読み上げ"
                title={`例文を読み上げ（${accentLabel} · ${speakLang}）`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {phrase.goodExample}
          </p>
          <p className="text-xs text-slate-400 mt-1">{phrase.goodExampleJa}</p>
        </div>
      </div>

      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saved || saving || !isLoaded}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all",
            saved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
              : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm"
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
              <BookmarkPlus className="h-3.5 w-3.5" />
              マイページに保存
            </>
          )}
        </button>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-400">
            明日は新しいフレーズをお届けします
          </p>
          <Link
            href="/library"
            className="text-[10px] font-mono text-indigo-500 hover:text-indigo-600 font-medium transition-colors shrink-0"
          >
            150件を全部見る →
          </Link>
        </div>
        <div className="mt-2 pt-2 border-t border-indigo-50/80 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400">
            文法の感覚も身につけたい？
          </span>
          <Link
            href="/library/grammar"
            className="text-[10px] font-mono font-semibold text-violet-600/90 hover:text-violet-500 transition-colors"
          >
            文法コアイメージ特集（無料）→
          </Link>
        </div>
      </div>
    </div>
  );
}
