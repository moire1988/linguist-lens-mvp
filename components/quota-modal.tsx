"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  registerWaitlistLoggedInAction,
  registerWaitlistGuestAction,
} from "@/app/actions/waitlist";
import { openLoginPrompt } from "@/lib/login-prompt-store";

interface QuotaModalProps {
  isLoggedIn: boolean;
  onClose: () => void;
}

export function QuotaModal({ isLoggedIn, onClose }: QuotaModalProps) {
  const [loading, setLoading]       = useState(false);
  const [registered, setRegistered] = useState(false);
  const [email, setEmail]           = useState("");

  // ── ログイン済み: 1クリック登録 ────────────────────────────────────────────
  const handleLoggedInClick = async () => {
    setLoading(true);
    const res = await registerWaitlistLoggedInAction();
    setLoading(false);
    if (res.ok) {
      setRegistered(true);
    } else {
      toast.error(res.error ?? "登録に失敗しました");
    }
  };

  // ── Guest: メアド送信 ───────────────────────────────────────────────────────
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await registerWaitlistGuestAction(email);
    setLoading(false);
    if (res.ok) {
      setRegistered(true);
    } else {
      toast.error(res.error ?? "登録に失敗しました");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-950 border border-slate-700/60 rounded-2xl shadow-[0_0_48px_rgba(99,102,241,0.18)] w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Terminal title bar ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/70">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="flex-1 text-center text-[10px] font-mono text-slate-500 tracking-wide">
            quota.check
          </span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 transition-colors"
            aria-label="閉じる"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5">
          {/* ── Terminal output block ──────────────────────────────────────── */}
          <div className="font-mono text-[11px] leading-relaxed space-y-0.5 bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-800 mb-5">
            <p>
              <span className="text-slate-500 select-none">$ </span>
              <span className="text-emerald-400">quota</span>
              <span className="text-slate-400"> --status</span>
            </p>
            <p className="text-slate-500">{">"} plan<span className="text-slate-600">:</span>{"        "}
              <span className="text-indigo-400">free</span>
            </p>
            <p className="text-slate-500">{">"} daily_limit<span className="text-slate-600">:</span>{"  "}
              <span className="text-slate-300">1</span>
            </p>
            <p className="text-slate-500">{">"} used_today<span className="text-slate-600">:</span>{"   "}
              <span className="text-slate-300">1</span>
            </p>
            <p className="text-slate-500">{">"} status<span className="text-slate-600">:</span>{"      "}
              <span className="text-rose-400 font-bold">[ LIMIT REACHED ]</span>
            </p>
            <p className="text-slate-500">{">"} resets<span className="text-slate-600">:</span>{"      "}
              <span className="text-slate-400">tomorrow 00:00 UTC</span>
            </p>
          </div>

          {/* ── Message ─────────────────────────────────────────────────────── */}
          <h2 className="text-white font-bold text-base mb-1.5 leading-snug">
            今日の無料枠（1回）を使い切りました
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-5">
            Proプランで制限なし。先行登録して優先アクセスを確保しましょう。
          </p>

          {/* ── CTA ─────────────────────────────────────────────────────────── */}
          {registered ? (
            <div className="w-full py-2.5 bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 rounded-xl text-sm text-center font-mono tracking-wide">
              ✓ 先行登録完了。リリース時にご連絡します。
            </div>
          ) : isLoggedIn ? (
            /* ログイン済み: 1クリック */
            <button
              onClick={handleLoggedInClick}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors mb-2.5"
            >
              {loading ? "登録中..." : "1クリックでWaitlistに登録"}
            </button>
          ) : (
            /* Guest: メアド入力 */
            <form onSubmit={handleGuestSubmit} className="mb-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-3.5 py-2.5 mb-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-xl text-sm text-slate-200 placeholder-slate-600 font-mono transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
              >
                {loading ? "登録中..." : "Waitlistに登録する"}
              </button>
            </form>
          )}

          {!registered && !isLoggedIn && (
            <button
              onClick={() => { onClose(); openLoginPrompt("generic"); }}
              className="w-full py-2 text-slate-500 hover:text-slate-300 text-xs transition-colors font-mono"
            >
              ログインして1クリック登録 →
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-slate-600 hover:text-slate-400 text-sm transition-colors font-mono"
          >
            また明日
          </button>
        </div>
      </div>
    </div>
  );
}
