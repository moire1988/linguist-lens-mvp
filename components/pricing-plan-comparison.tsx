"use client";

import { Check, Sparkles } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { WaitlistCta } from "@/components/waitlist-cta";

// ─── Free / Pro 比較（About の Pricing セクションと同一マークアップ）──────────

export function PricingPlanComparison({ className }: { className?: string }) {
  const { openSignIn } = useClerk();

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto",
        className
      )}
    >
      <div className="flex flex-col gap-5 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div>
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">
            Free
          </p>
          <div className="flex items-end gap-1.5 leading-none mb-2">
            <span className="text-4xl font-extrabold text-slate-900">¥0</span>
          </div>
          <p className="text-sm text-slate-500">まずはLinguistLensの価値を体験</p>
        </div>

        <ul className="space-y-2.5 flex-1">
          {[
            "アカウント作成後、累計3回までのAI解析",
            "解析結果・単語の保存（最大3件まで）",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-slate-600"
            >
              <span className="mt-0.5 w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-slate-500" />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => openSignIn()}
          className="w-full py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors"
        >
          無料で始める
        </button>
      </div>

      <div className="relative flex flex-col gap-5 p-6 rounded-2xl border-2 border-indigo-500 bg-white shadow-[0_4px_24px_rgba(99,102,241,0.12)]">
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold shadow-sm whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            おすすめ
          </span>
        </div>

        <div>
          <p className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-widest mb-2">
            Pro
          </p>
          <div className="flex items-end gap-1.5 leading-none mb-1">
            <span className="text-4xl font-extrabold text-slate-900">¥980</span>
            <span className="text-sm text-slate-400 mb-1">/ 月</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mb-1">※ 価格は予定です</p>
          <p className="text-sm text-slate-500">
            制限なしで、あらゆる英語コンテンツを自分の教材に
          </p>
        </div>

        <ul className="space-y-2.5 flex-1">
          {[
            "AI解析の無制限利用",
            "単語・解析結果の無制限保存",
            "覚えた単語を使ったAIオリジナル記事生成",
            "厳選表現ライブラリのフル利用（無制限閲覧・保存・検索・シャッフル）",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-slate-700"
            >
              <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-indigo-600" />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <WaitlistCta />
      </div>
    </div>
  );
}
