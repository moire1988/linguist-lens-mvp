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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Title bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <span className="flex-1 text-center text-[10px] font-mono text-slate-400 tracking-wide">
            quota.check
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="閉じる"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5">
          {/* ── Terminal output block ──────────────────────────────────────── */}
          <div className="font-mono text-[11px] leading-relaxed space-y-0.5 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 mb-5">
            <p>
              <span className="text-slate-400 select-none">$ </span>
              <span className="text-emerald-600">quota</span>
              <span className="text-slate-500"> --status</span>
            </p>
            <p className="text-slate-500">{">"} plan<span className="text-slate-400">:</span>{"        "}
              <span className="text-indigo-600">free</span>
            </p>
            <p className="text-slate-500">{">"} daily_limit<span className="text-slate-400">:</span>{"  "}
              <span className="text-slate-700">1</span>
            </p>
            <p className="text-slate-500">{">"} used_today<span className="text-slate-400">:</span>{"   "}
              <span className="text-slate-700">1</span>
            </p>
            <p className="text-slate-500">{">"} status<span className="text-slate-400">:</span>{"      "}
              <span className="text-rose-500 font-bold">[ LIMIT REACHED ]</span>
            </p>
            <p className="text-slate-500">{">"} resets<span className="text-slate-400">:</span>{"      "}
              <span className="text-slate-500">tomorrow 00:00 UTC</span>
            </p>
          </div>

          {/* ── Message ─────────────────────────────────────────────────────── */}
          <h2 className="text-slate-900 font-bold text-base mb-1.5 leading-snug">
            今日の無料枠（1回）を使い切りました
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-5">
            Proプランで制限なし。先行登録して優先アクセスを確保しましょう。
          </p>

          {/* ── CTA ─────────────────────────────────────────────────────────── */}
          {registered ? (
            <div className="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm text-center font-mono tracking-wide">
              ✓ 先行登録完了。リリース時にご連絡します。
            </div>
          ) : isLoggedIn ? (
            <button
              onClick={handleLoggedInClick}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
            >
              {loading ? "登録中..." : "1クリックでWaitlistに登録"}
            </button>
          ) : (
            <form onSubmit={handleGuestSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-3.5 py-2.5 mb-2 bg-white border border-slate-200 focus:border-indigo-400 focus:outline-none rounded-xl text-sm text-slate-800 placeholder-slate-400 font-mono transition-colors"
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
              className="w-full py-2 mt-2 text-slate-400 hover:text-indigo-600 text-xs transition-colors font-mono"
            >
              ログインして1クリック登録 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
