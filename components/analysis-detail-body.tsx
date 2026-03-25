"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PhraseCard } from "@/components/phrase-card";
import { ScriptViewer } from "@/components/script-viewer";
import { PaywallCTA } from "@/components/paywall-cta";
import { UpgradeModal } from "@/components/upgrade-modal";
import type { ExpressionType, PhraseResult } from "@/lib/types";
import {
  savePhrase,
  getVocabulary,
  getDailyRemaining,
  FREE_DAILY_LIMIT,
} from "@/lib/vocabulary";
import { saveVocabularyAction } from "@/app/actions/vocabulary";
import { useEffectiveAuth } from "@/lib/dev-auth";

const PAYWALL_THRESHOLD = 3;

const FILTER_OPTIONS: { value: "all" | ExpressionType; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "phrasal_verb", label: "句動詞" },
  { value: "idiom", label: "イディオム" },
  { value: "collocation", label: "コロケーション" },
  { value: "grammar_pattern", label: "文法パターン" },
];

export function AnalysisDetailBody(props: {
  sourceUrl: string;
  phrases: PhraseResult[];
  sourceText: string;
  highlightedHtml?: string;
  showPaywall: boolean;
  totalCount: number;
}) {
  const {
    sourceUrl,
    phrases,
    sourceText,
    highlightedHtml,
    showPaywall,
    totalCount,
  } = props;
  const { isSignedIn } = useAuth();
  const { isPro } = useEffectiveAuth();
  const [savedExpressions, setSavedExpressions] = useState<Set<string>>(
    new Set()
  );
  const [dailyRemaining, setDailyRemaining] = useState(FREE_DAILY_LIMIT);
  const [showPremium, setShowPremium] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | ExpressionType>("all");

  useEffect(() => {
    setSavedExpressions(
      new Set(getVocabulary().map((p) => p.expression.toLowerCase()))
    );
    setDailyRemaining(getDailyRemaining());
  }, []);

  const handleSave = useCallback(
    (phrase: PhraseResult) => {
      const key = phrase.expression.toLowerCase();
      if (savedExpressions.has(key)) return;
      const result = savePhrase({
        expression: phrase.expression,
        type: phrase.type,
        cefr_level: phrase.cefr_level,
        meaning_ja: phrase.meaning_ja,
        nuance: phrase.nuance,
        example: phrase.example,
        example_translation: phrase.example_translation,
        context: phrase.context,
        why_hard_for_japanese: phrase.why_hard_for_japanese,
        sourceUrl,
      });
      if (result.success) {
        setSavedExpressions((s) => {
          const n = new Set(Array.from(s));
          n.add(key);
          return n;
        });
        setDailyRemaining((r) => Math.max(0, r - 1));
        if (isSignedIn) {
          void saveVocabularyAction({
            expression: phrase.expression,
            type: phrase.type,
            cefr_level: phrase.cefr_level,
            meaning_ja: phrase.meaning_ja,
            nuance: phrase.nuance,
            example: phrase.example,
            example_translation: phrase.example_translation,
            context: phrase.context,
            why_hard_for_japanese: phrase.why_hard_for_japanese,
            sourceUrl,
            status: "learning",
          });
        }
        toast.success("単語帳に保存しました", {
          description: `「${phrase.expression}」をマイ単語帳に追加しました`,
        });
      } else if (result.reason === "limit_reached") {
        setShowPremium(true);
      }
    },
    [savedExpressions, sourceUrl, isSignedIn]
  );

  const filteredPhrases = useMemo(() => {
    if (activeFilter === "all") return phrases;
    return phrases.filter((p) => p.type === activeFilter);
  }, [phrases, activeFilter]);

  const visiblePhrases = showPaywall
    ? filteredPhrases.slice(0, PAYWALL_THRESHOLD)
    : filteredPhrases;
  const blurredPhrases = showPaywall
    ? filteredPhrases.slice(PAYWALL_THRESHOLD, PAYWALL_THRESHOLD + 2)
    : [];

  const scriptText = sourceText.trim();

  return (
    <>
      {showPremium && (
        <UpgradeModal
          reason="vocab_limit"
          onClose={() => setShowPremium(false)}
        />
      )}

      <div className="mb-8">
        <ScriptViewer
          text={scriptText}
          phrases={phrases}
          highlightedHtml={highlightedHtml}
          savedExpressions={savedExpressions}
          onSave={handleSave}
          showTranslate
          isPro={isPro}
          dailyRemaining={dailyRemaining}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-indigo-600">
            {filteredPhrases.length}
          </span>
          <span className="text-sm text-slate-600">個の表現</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_OPTIONS.filter((opt) => {
          if (opt.value === "all") return true;
          return phrases.some((p) => p.type === opt.value);
        }).map((opt) => {
          const count =
            opt.value === "all"
              ? phrases.length
              : phrases.filter((p) => p.type === opt.value).length;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setActiveFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                activeFilter === opt.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "ml-1.5 font-bold",
                  activeFilter === opt.value
                    ? "text-indigo-200"
                    : "text-slate-400"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredPhrases.length === 0 ? (
        <p className="text-sm text-slate-500 mb-8 text-center py-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          このカテゴリに該当する表現がありません。
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {visiblePhrases.map((phrase, i) =>
            phrase ? (
              <PhraseCard
                key={`visible-${phrase.expression}-${i}`}
                phrase={phrase}
                savedExpressions={savedExpressions}
                dailyRemaining={dailyRemaining}
                onSave={handleSave}
              />
            ) : null
          )}
        </div>
      )}

      {showPaywall && totalCount > PAYWALL_THRESHOLD && (
        <div className="mt-3 mb-8">
          {blurredPhrases.length > 0 && (
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 blur-[3px] opacity-50 pointer-events-none select-none">
                {blurredPhrases.map((phrase, i) =>
                  phrase ? (
                    <PhraseCard
                      key={`blurred-${phrase.expression}-${i}`}
                      phrase={phrase}
                      savedExpressions={savedExpressions}
                      dailyRemaining={dailyRemaining}
                      onSave={handleSave}
                    />
                  ) : null
                )}
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 0%, #f7f8ff 80%)",
                }}
              />
            </div>
          )}

          <div className="mt-4">
            <PaywallCTA
              totalCount={totalCount}
              shownCount={PAYWALL_THRESHOLD}
            />
          </div>
        </div>
      )}
    </>
  );
}
