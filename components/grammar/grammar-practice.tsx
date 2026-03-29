"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { PracticeItem } from "@/lib/grammar-lesson";
import { trackGrammarPracticeCompleted } from "@/lib/analytics";

export interface GrammarPracticeProps {
  items: PracticeItem[];
  slug: string;
}

export function GrammarPractice({ items, slug }: GrammarPracticeProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const trackedPerfectRef = useRef(false);

  const total = items.length;
  const answeredCount = Object.keys(answers).length;
  const correctCount = items.filter(
    (it) => answers[it.id] === it.correctIndex
  ).length;
  const allAnswered = answeredCount === total && total > 0;

  useEffect(() => {
    if (
      !allAnswered ||
      correctCount !== total ||
      trackedPerfectRef.current ||
      total === 0
    ) {
      return;
    }
    trackedPerfectRef.current = true;
    trackGrammarPracticeCompleted({
      slug,
      score: correctCount,
      total,
    });
  }, [allAnswered, correctCount, total, slug]);

  function selectOption(itemId: string, optionIndex: number): void {
    setAnswers((prev) => {
      if (prev[itemId] !== undefined) return prev;
      return { ...prev, [itemId]: optionIndex };
    });
  }

  return (
    <section className="mb-10 rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-1">ミニクイズ</h2>
      <p className="text-xs text-slate-500 mb-6">
        各問の正しい選択肢を選び、解説でイメージを固めましょう。
      </p>
      <div className="space-y-8">
        {items.map((item, qIndex) => {
          const chosen = answers[item.id];
          const done = chosen !== undefined;
          const isCorrect = chosen === item.correctIndex;
          return (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900 mb-3 whitespace-pre-wrap leading-relaxed">
                <span className="text-indigo-500 font-mono mr-2">
                  Q{qIndex + 1}.
                </span>
                {item.prompt}
              </p>
              <ul className="space-y-2">
                {item.options.map((opt, i) => {
                  const selected = chosen === i;
                  const showResult = done;
                  const thisCorrect = i === item.correctIndex;
                  const wrongPick = showResult && selected && !thisCorrect;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        disabled={done}
                        onClick={() => selectOption(item.id, i)}
                        className={cn(
                          "w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-colors",
                          !done &&
                            "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40",
                          done &&
                            thisCorrect &&
                            "border-emerald-300 bg-emerald-50 text-emerald-900",
                          wrongPick && "border-red-200 bg-red-50 text-red-900",
                          done &&
                            !selected &&
                            !thisCorrect &&
                            "border-slate-100 text-slate-400"
                        )}
                      >
                        <span className="font-mono text-xs text-slate-400 mr-2">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {done ? (
                <div
                  className={cn(
                    "mt-4 rounded-lg border p-3 text-sm leading-relaxed",
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                      : "border-amber-200 bg-amber-50/80 text-amber-950"
                  )}
                >
                  <p className="font-semibold mb-1">
                    {isCorrect ? "正解です" : "不正解"}
                  </p>
                  <p className="text-slate-700">{item.explanation}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {allAnswered ? (
        <div className="mt-8 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 text-center">
          <p className="text-lg font-bold text-slate-900">
            {correctCount}/{total} 問正解！
          </p>
          {correctCount === total ? (
            <p className="text-sm text-slate-600 mt-2">
              Perfect! ネイティブ感覚が身についています。下の CTA
              から実践に進みましょう。
            </p>
          ) : correctCount >= Math.ceil(total * 0.6) ? (
            <p className="text-sm text-slate-600 mt-2">
              あと一歩です。コアイメージ（実体 vs
              矢印）に立ち返ってもう一度読み直すと定着しやすくなります。
            </p>
          ) : (
            <p className="text-sm text-slate-600 mt-2">
              動詞ごとのセクションをゆっくり復習してから、もう一度チャレンジしてみてください。
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
