"use client";

import { X, Sparkles, Star, Lock } from "lucide-react";
import { FREE_DAILY_LIMIT } from "@/lib/vocabulary";

interface PremiumModalProps {
  onClose: () => void;
}

const FEATURES = [
  "無制限の単語保存",
  "優先 AI モデルアクセス",
  "高度なフラッシュカード機能",
  "学習進捗レポート",
];

export function PremiumModal({ onClose }: PremiumModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-6 pt-6 pb-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Star className="h-7 w-7 text-yellow-300" />
          </div>
          <h2 className="text-xl font-bold text-white">プレミアムプラン</h2>
          <p className="text-indigo-200 text-sm mt-1">
            無制限で学習を続けましょう
          </p>
        </div>

        <div className="px-6 py-5">
          {/* Limit notice */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5">
            <Lock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                本日の保存上限（{FREE_DAILY_LIMIT}件）に達しました
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                毎日 0:00 にリセットされます
              </p>
            </div>
          </div>

          {/* Features */}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            プレミアム特典
          </p>
          <ul className="space-y-2.5 mb-6">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-indigo-600" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            disabled
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm opacity-50 cursor-not-allowed mb-3"
          >
            プレミアムプランに登録（準備中）
          </button>
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
