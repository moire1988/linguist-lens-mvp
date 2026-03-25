"use client";

import { useState, useTransition } from "react";
import { Globe, Lock, Link2, Check, Loader2 } from "lucide-react";
import { toggleAnalysisPublicAction } from "@/app/actions/save-analysis";
import { toast } from "sonner";

// ─── X (Twitter) icon ────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  analysisId: string;
  initialIsPublic: boolean;
  isOwner: boolean;
  shareUrl: string;
  phraseCount: number;
  cefrLevel: string;
}

export function AnalysisSharePanel({
  analysisId,
  initialIsPublic,
  isOwner,
  shareUrl,
  phraseCount,
  cefrLevel,
}: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  if (!isOwner) return null;

  const handleToggle = () => {
    const next = !isPublic;
    setIsPublic(next); // optimistic update
    startTransition(async () => {
      const result = await toggleAnalysisPublicAction(analysisId, next);
      if (!result.ok) {
        setIsPublic(!next); // revert
        toast.error("更新に失敗しました", { description: result.error });
      } else {
        toast.success(next ? "🌐 この解析を公開しました" : "🔒 非公開にしました");
      }
    });
  };

  const tweetText = encodeURIComponent(
    `${cefrLevel}レベルの英語コンテンツから${phraseCount}個の重要表現を抽出しました！ #LinguistLens #英語学習`
  );
  const tweetUrl = encodeURIComponent(shareUrl);
  const tweetHref = `https://x.com/intent/tweet?url=${tweetUrl}&text=${tweetText}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("URLをコピーしました");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-8 space-y-4">
      {/* Header */}
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        シェア設定
      </p>

      {/* Toggle row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {isPublic ? (
            <Globe className="h-4 w-4 text-indigo-500 flex-shrink-0" />
          ) : (
            <Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {isPublic ? "公開中" : "非公開"}
            </p>
            <p className="text-xs text-slate-400 leading-snug">
              {isPublic
                ? "URLを知っている人が誰でも閲覧できます"
                : "あなただけが閲覧できます"}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={isPublic}
          className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60"
          style={{ background: isPublic ? "#6366f1" : "#e2e8f0" }}
        >
          {isPending ? (
            <Loader2
              className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin"
              style={{ color: isPublic ? "#fff" : "#94a3b8" }}
            />
          ) : (
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: isPublic ? "translateX(20px)" : "translateX(0)" }}
            />
          )}
        </button>
      </div>

      {/* Share buttons – only visible when public */}
      {isPublic && (
        <div className="flex flex-wrap gap-2 pt-1">
          {/* X share */}
          <a
            href={tweetHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors"
          >
            <XIcon className="h-3.5 w-3.5" />
            X でシェア
          </a>

          {/* URL copy */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600">コピー済み！</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                URLをコピー
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
