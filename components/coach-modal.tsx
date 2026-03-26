"use client";

import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  X,
  Brain,
  Sparkles,
  Target,
  Loader2,
  Lightbulb,
  Clapperboard,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type { SavedPhrase } from "@/lib/vocabulary";
import {
  analyzeVocabulary,
  type CoachAnalysis,
} from "@/app/actions/coach";
import { ModalPortal } from "@/components/modal-portal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoachModalProps {
  vocabulary: SavedPhrase[];
  onClose: () => void;
}

// ─── Markdown（コーチ本文） ─────────────────────────────────────────────────

const COACH_MD_COMPONENTS: Components = {
  p({ children }: { children?: ReactNode }) {
    return (
      <p className="mb-3 text-sm leading-relaxed text-slate-700 last:mb-0">
        {children}
      </p>
    );
  },
  strong({ children }: { children?: ReactNode }) {
    return (
      <strong className="font-semibold text-slate-800">{children}</strong>
    );
  },
  em({ children }: { children?: ReactNode }) {
    return <em className="italic text-slate-600">{children}</em>;
  },
  ul({ children }: { children?: ReactNode }) {
    return (
      <ul className="mb-3 mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700 last:mb-0">
        {children}
      </ul>
    );
  },
  ol({ children }: { children?: ReactNode }) {
    return (
      <ol className="mb-3 mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700 last:mb-0">
        {children}
      </ol>
    );
  },
  li({ children }: { children?: ReactNode }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  h2({ children }: { children?: ReactNode }) {
    return (
      <h2 className="mb-2 mt-4 text-sm font-bold text-slate-800 first:mt-0">
        {children}
      </h2>
    );
  },
  h3({ children }: { children?: ReactNode }) {
    return (
      <h3 className="mb-1.5 mt-3 text-xs font-bold text-slate-700 first:mt-0">
        {children}
      </h3>
    );
  },
};

function CoachMarkdown({ source }: { source: string }) {
  return (
    <div className="coach-md">
      <ReactMarkdown components={COACH_MD_COMPONENTS}>{source}</ReactMarkdown>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CoachModal({ vocabulary, onClose }: CoachModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
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
    <ModalPortal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient header ── */}
        <div className="relative flex-shrink-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 pb-7 pt-6 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">AIコーチ分析</h2>
          <p className="mt-1 text-sm text-indigo-100">
            {vocabulary.length}個の表現から、あなた専用のフィードバックを作成
          </p>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Idle */}
          {status === "idle" && (
            <div className="px-6 py-8 text-center">
              <p className="mb-6 text-sm leading-relaxed text-slate-500">
                保存した表現をもとに、
                <span className="font-semibold text-slate-700">
                  現在地の整理・学習のコツ・今日のアクション
                </span>
                を
                <br />
                3つのパートでお届けします。
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                分析スタート
              </button>
            </div>
          )}

          {/* Loading */}
          {status === "loading" && (
            <div className="px-6 py-14 text-center">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-sm font-semibold text-slate-700">
                AIが分析中...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                コーチがあなた向けの提案をまとめています
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="px-6 py-10 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-400" />
              <p className="mb-4 text-sm text-rose-500">{errorMsg}</p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50"
              >
                やり直す
              </button>
            </div>
          )}

          {/* Result */}
          {status === "done" && analysis && (
            <div className="space-y-4 px-6 py-5">
              <section className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Target className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>🎯 あなたの現在地（分析）</span>
                </h3>
                <CoachMarkdown source={analysis.current_situation_md} />
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Lightbulb className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>💡 おすすめの学習法（ソリューション）</span>
                </h3>
                <CoachMarkdown source={analysis.learning_method_md} />
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Clapperboard className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>🎬 今日のアクションプラン（具体例）</span>
                </h3>
                <CoachMarkdown source={analysis.action_plan_md} />
              </section>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 border-t border-slate-100 px-6 pb-5 pt-3">
          {status === "done" && (
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setAnalysis(null);
              }}
              className="mb-2 w-full py-2 text-xs text-slate-400 transition-colors hover:text-indigo-500"
            >
              再分析する
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
