"use client";

import { useClerk } from "@clerk/nextjs";
import { Lock, Sparkles } from "lucide-react";

interface Props {
  totalCount: number;
  shownCount: number;
}

export function PaywallCTA({ totalCount, shownCount }: Props) {
  const { openSignIn } = useClerk();
  const remaining = totalCount - shownCount;

  return (
    <div className="relative rounded-2xl border border-indigo-100 bg-white/95 backdrop-blur-sm shadow-lg shadow-indigo-100/50 p-8 text-center overflow-hidden">
      {/* Decorative gradient ring */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-violet-400/20 to-indigo-400/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-400/15 to-cyan-400/15 blur-2xl pointer-events-none" />

      <div className="relative">
        {/* Lock badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-indigo-200">
            <Lock className="h-5 w-5 text-white" />
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-lg font-extrabold text-slate-900 mb-2 leading-snug">
          残り <span className="text-indigo-600">{remaining}個</span> の表現を確認するには
          <br />
          無料登録してください
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
          LinguistLensに無料登録すると、この解析の全表現が閲覧できます。
          さらに、自分の好きなYouTube動画や記事のURLを貼るだけで、
          あなただけの英語表現リストが作れます。
        </p>

        {/* CTA button */}
        <button
          onClick={() => openSignIn()}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          無料ではじめる
        </button>

        <p className="mt-3 text-[11px] text-slate-400">
          クレジットカード不要 · 30秒で登録完了
        </p>
      </div>
    </div>
  );
}
