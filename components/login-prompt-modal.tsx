"use client";

import { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { X, Sparkles, BookmarkPlus, Mic, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  subscribeLoginPrompt,
  closeLoginPrompt,
  type LoginPromptConfig,
  type LoginPromptFeature,
} from "@/lib/login-prompt-store";

// ─── Feature-specific copy ────────────────────────────────────────────────────

const FEATURE_COPY: Record<
  LoginPromptFeature,
  {
    icon: React.ElementType;
    iconClass: string;
    iconBg: string;
    title: string;
    body: string;
    cta: string;
  }
> = {
  extraction: {
    icon: Sparkles,
    iconClass: "text-violet-500",
    iconBg: "bg-violet-50",
    title: "無料解析は1回まで",
    body: "ゲストの方が使える無料解析は1回です。\nログインすると無制限に解析できます。",
    cta: "ログインして無制限に使う",
  },
  save: {
    icon: BookmarkPlus,
    iconClass: "text-indigo-500",
    iconBg: "bg-indigo-50",
    title: "ログインが必要です",
    body: "フレーズを単語帳に保存するには\nログインが必要です。",
    cta: "ログインして単語帳を使う",
  },
  practice: {
    icon: Mic,
    iconClass: "text-sky-500",
    iconBg: "bg-sky-50",
    title: "ログインが必要です",
    body: "音読練習機能を使うには\nログインが必要です。",
    cta: "ログインして音読練習する",
  },
  generic: {
    icon: LogIn,
    iconClass: "text-slate-500",
    iconBg: "bg-slate-50",
    title: "ログインが必要です",
    body: "この機能を使うには\nログインが必要です。",
    cta: "ログインする",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginPromptModal() {
  const [config, setConfig] = useState<LoginPromptConfig | null>(null);
  const { openSignIn } = useClerk();

  useEffect(() => subscribeLoginPrompt(setConfig), []);

  if (!config) return null;

  const cfg = FEATURE_COPY[config.feature];
  const Icon = cfg.icon;

  const handleSignIn = () => {
    closeLoginPrompt();
    openSignIn();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLoginPrompt();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm mx-4">
        {/* Close */}
        <button
          onClick={closeLoginPrompt}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", cfg.iconBg)}>
          <Icon className={cn("h-6 w-6", cfg.iconClass)} />
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-slate-900 mb-2">{cfg.title}</h2>

        {/* Body */}
        <p className="text-sm text-slate-500 leading-relaxed mb-6 whitespace-pre-line">{cfg.body}</p>

        {/* Primary CTA */}
        <button
          onClick={handleSignIn}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 transition-all shadow-sm"
        >
          {cfg.cta}
        </button>

        {/* Skip */}
        <button
          onClick={closeLoginPrompt}
          className="w-full mt-2.5 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          今はしない
        </button>
      </div>
    </div>
  );
}
