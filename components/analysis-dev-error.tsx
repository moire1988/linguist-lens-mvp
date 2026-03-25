"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { AnalysisLoadFailure } from "@/lib/analysis-load-types";

/**
 * 開発環境のみ: 解析詳細の読み込み失敗理由を画面とブラウザコンソールに出す。
 */
export function AnalysisDevErrorPanel(props: {
  id: string;
  failure: AnalysisLoadFailure;
}) {
  const { id, failure } = props;

  useEffect(() => {
    console.error("[LinguistLens dev] Analysis load failed (browser)", {
      id,
      failure,
    });
  }, [id, failure]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-mono text-sm">
      <div className="max-w-3xl mx-auto border border-amber-500/50 rounded-lg bg-slate-900/80 p-4 shadow-lg">
        <p className="text-amber-400 font-semibold mb-2">
          [DEV] 解析結果の読み込みに失敗しました
        </p>
        <p className="text-slate-400 text-xs mb-4">
          normalized id:{" "}
          <code className="text-slate-200 break-all">{id}</code>
        </p>
        <pre className="text-xs overflow-auto whitespace-pre-wrap break-all border border-slate-700 rounded p-3 bg-slate-950">
          {JSON.stringify(failure, null, 2)}
        </pre>
        <Link
          href="/"
          className="inline-block mt-4 text-indigo-400 hover:text-indigo-300 underline"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
