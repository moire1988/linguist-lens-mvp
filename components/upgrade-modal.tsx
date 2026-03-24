"use client";

import { useState } from "react";
import { X, Sparkles, Star, Lock, Check, Loader2 } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  registerWaitlistLoggedInAction,
  registerWaitlistGuestAction,
} from "@/app/actions/waitlist";
import { FREE_DAILY_LIMIT } from "@/lib/vocabulary";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UpgradeReason = "vocab_limit" | "daily_limit" | "pro_feature";

interface UpgradeModalProps {
  onClose: () => void;
  reason?: UpgradeReason;
}

// ─── Static content ───────────────────────────────────────────────────────────

const NOTICE: Record<UpgradeReason, { title: string; sub: string }> = {
  vocab_limit: {
    title: `本日の保存上限（${FREE_DAILY_LIMIT}件）に達しました`,
    sub:   "毎日 0:00 にリセットされます",
  },
  daily_limit: {
    title: "今日の無料枠（1回）を使い切りました",
    sub:   "明日 0:00 にリセットされます",
  },
  pro_feature: {
    title: "この機能はProプランで利用可能です",
    sub:   "準備中のProプランでご利用いただけます",
  },
};

const FEATURES = [
  "解析回数無制限",
  "無制限の単語帳保存",
  "優先 AI モデルアクセス",
  "高度なフラッシュカード機能",
];

// ─── Component ────────────────────────────────────────────────────────────────

export function UpgradeModal({ onClose, reason = "vocab_limit" }: UpgradeModalProps) {
  const { isSignedIn } = useAuth();
  const { openSignIn }  = useClerk();
  const [loading, setLoading]       = useState(false);
  const [registered, setRegistered] = useState(false);
  const [email, setEmail]           = useState("");
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  const handleLoggedIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await registerWaitlistLoggedInAction();
    setLoading(false);
    if (res.ok) {
      setRegistered(true);
    } else {
      setErrorMsg(res.error ?? "登録に失敗しました");
    }
  };

  const handleGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const res = await registerWaitlistGuestAction(email);
    setLoading(false);
    if (res.ok) {
      setRegistered(true);
    } else {
      setErrorMsg(res.error ?? "登録に失敗しました");
    }
  };

  const notice = NOTICE[reason];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient header ──────────────────────────────────────────────── */}
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
          <p className="text-indigo-200 text-sm mt-1">無制限で学習を続けましょう</p>
        </div>

        <div className="px-6 py-5">
          {/* ── Notice ───────────────────────────────────────────────────── */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5">
            <Lock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{notice.title}</p>
              <p className="text-xs text-amber-600 mt-0.5">{notice.sub}</p>
            </div>
          </div>

          {/* ── Features ─────────────────────────────────────────────────── */}
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

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          {registered ? (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700">
                登録しました！リリース時にお知らせします 🎉
              </p>
            </div>
          ) : isSignedIn ? (
            <>
              {errorMsg && <p className="text-xs text-rose-600 mb-2">{errorMsg}</p>}
              <button
                onClick={handleLoggedIn}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />登録中...</>
                ) : (
                  "1クリックでWaitlistに登録"
                )}
              </button>
            </>
          ) : (
            <form onSubmit={handleGuest} className="mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-3.5 py-2.5 mb-2 bg-white border border-slate-200 focus:border-indigo-400 focus:outline-none rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-colors"
              />
              {errorMsg && <p className="text-xs text-rose-600 mb-2">{errorMsg}</p>}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />登録中...</>
                ) : (
                  "Waitlistに登録する"
                )}
              </button>
              <button
                type="button"
                onClick={() => { onClose(); openSignIn(); }}
                className="w-full py-2 mt-1 text-slate-400 hover:text-indigo-600 text-xs transition-colors"
              >
                ログインして1クリック登録 →
              </button>
            </form>
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
