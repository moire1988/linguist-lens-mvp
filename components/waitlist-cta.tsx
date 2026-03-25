"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  registerWaitlistLoggedInAction,
  registerWaitlistGuestAction,
} from "@/app/actions/waitlist";

/**
 * `UpgradeModal` / ライブラリのティーザーと同じ Waitlist 登録フロー。
 */
export function WaitlistCta({ className }: { className?: string }) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  if (registered) {
    return (
      <div
        className={cn(
          "flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-left",
          className
        )}
      >
        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-emerald-700">
          登録しました！リリース時にお知らせします 🎉
        </p>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className={cn("w-full space-y-2", className)}>
        {errorMsg && (
          <p className="text-xs text-rose-600 text-left">{errorMsg}</p>
        )}
        <button
          type="button"
          onClick={handleLoggedIn}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              登録中...
            </>
          ) : (
            "1クリックでWaitlistに登録"
          )}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleGuest} className={cn("w-full space-y-2", className)}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-400 focus:outline-none rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-colors"
      />
      {errorMsg && (
        <p className="text-xs text-rose-600 text-left">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            登録中...
          </>
        ) : (
          "Waitlistに登録する"
        )}
      </button>
      <button
        type="button"
        onClick={() => openSignIn()}
        className="w-full py-2 text-slate-400 hover:text-indigo-600 text-xs transition-colors"
      >
        ログインして1クリック登録 →
      </button>
    </form>
  );
}
