"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNewsletterWantsEmail } from "@/hooks/use-newsletter-wants-email";

export default function ChromeExtensionTeaser() {
  const { loaded, wantsEmail, isSignedIn } = useNewsletterWantsEmail();
  /** メルマガ登録済みのログインユーザーはスクロール先バナーが無いため非表示 */
  const showNotifyButton =
    !isSignedIn || (loaded && !wantsEmail);

  const scrollToWaitlist = (): void => {
    document
      .getElementById("extension-waitlist-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-[1px] transition-all duration-300",
        "bg-gradient-to-r from-violet-500/50 via-indigo-400/30 to-cyan-400/40",
        "hover:from-violet-500/90 hover:via-indigo-400/35 hover:to-cyan-500/70"
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4 rounded-[15px] bg-slate-900 px-4 py-3.5 sm:px-5">
        <div className="flex shrink-0 flex-col gap-0.5">
          <div className="flex items-center">
            <span
              className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"
              aria-hidden
            />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-violet-400/80">
              COMING SOON
            </span>
          </div>
          <p className="text-sm font-bold text-white">Chrome 拡張機能</p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug text-slate-200 sm:text-[13px]">
            開いたページをワンクリックで解析
          </p>
          <p className="mt-0.5 hidden text-[10px] text-slate-500 sm:block">
            URLコピペ不要 — ブラウザから直接起動できるようになります
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://x.com/LinguistLens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-black px-3 py-1.5 text-xs font-semibold text-white transition-all hover:border-zinc-400 hover:bg-zinc-800"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.76l7.73-8.835L1.254 2.25H8.08l4.259 5.626L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
            <span className="hidden sm:inline">Xでフォロー</span>
            <span className="sm:hidden">フォロー</span>
          </a>
          {showNotifyButton && (
            <button
              type="button"
              onClick={scrollToWaitlist}
              className="flex items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-600/15 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-all hover:border-violet-400/60 hover:bg-violet-600/30"
            >
              <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">通知を受け取る</span>
              <span className="sm:hidden">通知</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
