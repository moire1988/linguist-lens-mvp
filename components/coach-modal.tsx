"use client";

import { useState, useCallback } from "react";
import {
  X,
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Loader2,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavedPhrase } from "@/lib/vocabulary";
import {
  analyzeVocabulary,
  type CoachAnalysis,
} from "@/app/actions/coach";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoachModalProps {
  vocabulary: SavedPhrase[];
  onClose: () => void;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { color: string }> = {
  phrasal_verb:   { color: "bg-violet-100 text-violet-700 border-violet-200" },
  idiom:          { color: "bg-amber-100  text-amber-700  border-amber-200"  },
  collocation:    { color: "bg-sky-100    text-sky-700    border-sky-200"    },
  grammar_pattern:{ color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function CoachModal({ vocabulary, onClose }: CoachModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyze = useCallback(async () => {
    setStatus("loading");
    const result = await analyzeVocabulary(
      vocabulary.map((p) => ({
        expression: p.expression,
        type: p.type,
        cefr_level: p.cefr_level,
        meaning_ja: p.meaning_ja,
      }))
    );
    if (result.success) {
      setAnalysis(result.data);
      setStatus("done");
    } else {
      setErrorMsg(result.error);
      setStatus("error");
    }
  }, [vocabulary]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient header ── */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 pt-6 pb-7 text-center relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">AIコーチ分析</h2>
          <p className="text-indigo-100 text-sm mt-1">
            {vocabulary.length}個の表現から学習傾向を分析
          </p>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Idle */}
          {status === "idle" && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                保存した{vocabulary.length}個の表現をもとに、AIがあなたの
                <br />
                <span className="font-semibold text-slate-700">苦手パターン・強み・学習アドバイス</span>
                を提供します。
              </p>
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white rounded-xl font-semibold text-sm transition-opacity shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                分析スタート
              </button>
            </div>
          )}

          {/* Loading */}
          {status === "loading" && (
            <div className="px-6 py-14 text-center">
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-700">
                AIが分析中...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                学習パターンを解析しています
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="px-6 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
              <p className="text-sm text-rose-500 mb-4">{errorMsg}</p>
              <button
                onClick={() => setStatus("idle")}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              >
                やり直す
              </button>
            </div>
          )}

          {/* Result */}
          {status === "done" && analysis && (
            <div className="px-6 py-5 space-y-5">

              {/* 苦手パターン */}
              <section>
                <h3 className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  苦手パターン分析
                </h3>
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {analysis.weakness_summary}
                  </p>
                </div>
              </section>

              {/* タイプ別内訳 */}
              {analysis.type_breakdown?.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    タイプ別内訳
                  </h3>
                  <div className="space-y-2">
                    {analysis.type_breakdown.map((item) => {
                      const cfg = TYPE_CONFIG[item.type];
                      return (
                        <div
                          key={item.type}
                          className="bg-slate-50 rounded-xl p-3 border border-slate-100"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={cn(
                                "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                                cfg?.color ?? "bg-slate-100 text-slate-600 border-slate-200"
                              )}
                            >
                              {item.label}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">
                              {item.count}個
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.insight}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 得意な分野 */}
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  得意な分野
                </h3>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {analysis.strong_areas}
                  </p>
                </div>
              </section>

              {/* 学習アドバイス */}
              {analysis.recommendations?.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    <Target className="h-3.5 w-3.5" />
                    学習アドバイス
                  </h3>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 flex gap-3"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-indigo-800 mb-0.5">
                            {rec.title}
                          </p>
                          <p className="text-xs text-indigo-700 leading-relaxed">
                            {rec.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 励ましメッセージ */}
              <section className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">
                  <MessageSquare className="h-3 w-3" />
                  AIコーチより
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {analysis.encouragement}
                </p>
              </section>

            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
          {status === "done" && (
            <button
              onClick={() => { setStatus("idle"); setAnalysis(null); }}
              className="w-full py-2 mb-2 text-xs text-slate-400 hover:text-indigo-500 transition-colors"
            >
              再分析する
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
