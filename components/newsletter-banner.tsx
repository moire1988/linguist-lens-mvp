"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppAuth } from "@/hooks/useAppAuth";
import { useNewsletterWantsEmail } from "@/hooks/use-newsletter-wants-email";
import { openLoginPrompt } from "@/lib/login-prompt-store";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { USER_PREFERENCES_CHANGED_EVENT } from "@/lib/db/preferences";

// ─── Subscribe button ─────────────────────────────────────────────────────────

function SubscribeButton({
  status,
  onClick,
  dark = false,
}: {
  status: "idle" | "loading" | "done";
  onClick: () => void;
  dark?: boolean;
}) {
  if (status === "done") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ${
          dark
            ? "bg-white/20 text-white"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}
      >
        <Check className="h-4 w-4" />
        登録済み
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={status === "loading"}
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
        dark
          ? "bg-white text-indigo-700 hover:bg-indigo-50"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {status === "loading" ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          登録中...
        </>
      ) : (
        <>登録する →</>
      )}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewsletterBanner({ variant = "default" }: { variant?: "default" | "compact" }) {
  const { isSignedIn } = useAppAuth();
  const { loaded: wantsEmailLoaded, wantsEmail } = useNewsletterWantsEmail();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      openLoginPrompt("generic");
      return;
    }
    setStatus("loading");
    const result = await subscribeNewsletter();
    if (result.success) {
      setStatus("done");
      window.dispatchEvent(new CustomEvent(USER_PREFERENCES_CHANGED_EVENT));
      toast.success("メルマガ登録が完了しました！");
    } else {
      setStatus("idle");
      toast.error("登録に失敗しました。もう一度お試しください。");
    }
  };

  if (isSignedIn && wantsEmailLoaded && wantsEmail) {
    return null;
  }
  if (isSignedIn && !wantsEmailLoaded) {
    return null;
  }

  // ── Compact variant (article detail page 下部用) ──────────────────────────
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4">
        <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
        <p className="text-sm text-slate-600 flex-1 leading-snug">
          AIが解析した最新の英語コンテンツや、便利な新機能のお知らせをメールで受け取れます。
        </p>
        <SubscribeButton status={status} onClick={handleSubscribe} />
      </div>
    );
  }

  // ── Default variant (記事一覧ページ上部用) ───────────────────────────────
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 sm:p-8">
      {/* Decorative dot grid */}
      <div className="absolute top-3 right-3 grid grid-cols-6 gap-[5px] opacity-[0.12]">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-1 h-1 bg-white rounded-full" />
        ))}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-indigo-300" />
          <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest">
            Newsletter
          </span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-snug">
          LinguistLens Updates 🚀
        </h3>
        <p className="text-sm text-indigo-200 mb-5 leading-relaxed">
          AIが解析した最新の英語コンテンツや、便利な新機能のお知らせをメールで受け取れます。
        </p>
        <SubscribeButton status={status} onClick={handleSubscribe} dark />
      </div>
    </div>
  );
}
