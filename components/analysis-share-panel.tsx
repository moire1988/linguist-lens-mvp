"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toggleAnalysisPublicAction } from "@/app/actions/save-analysis";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    setIsPublic(next);
    startTransition(async () => {
      const result = await toggleAnalysisPublicAction(analysisId, next);
      if (!result.ok) {
        setIsPublic(!next);
        toast.error("更新に失敗しました", { description: result.error });
      } else {
        toast.success(next ? "🌐 この解析を公開しました" : "🔒 非公開にしました");
      }
    });
  };

  const tweetText = `LinguistLensで${cefrLevel}レベルの英語表現を${phraseCount}個抽出しました！✨
#LinguistLens #英語学習`;
  const tweetHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tweetText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("コピーしました！");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 mb-8 transition-colors duration-300",
        isPublic
          ? "border-indigo-200 bg-indigo-50/50 shadow-sm shadow-indigo-100/40"
          : "border-slate-200 bg-white"
      )}
    >
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
        シェア設定
      </p>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-base font-bold text-slate-900 leading-tight">
            {isPublic ? "🌍 公開中" : "🔒 非公開"}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {isPublic
              ? "トップページの『みんなの解析』に掲載され、他の学習者も閲覧できるようになります。"
              : "マイページからあなただけがアクセスできます。"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={isPublic}
          className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60 self-start sm:mt-1"
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

      {/* 公開時のみ：アコーディオン風にシェアアクション */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isPublic ? "grid-rows-[1fr] mt-5" : "grid-rows-[0fr] mt-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "space-y-3 border-t pt-4 transition-opacity duration-300 ease-out",
              isPublic
                ? "border-indigo-200/80 opacity-100 translate-y-0"
                : "border-transparent opacity-0 pointer-events-none -translate-y-1"
            )}
            aria-hidden={!isPublic}
          >
            <p className="text-xs font-medium text-indigo-700/90">
              シェアして学習仲間を増やそう
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={tweetHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <XIcon className="h-3.5 w-3.5" />
                X（Twitter）でシェア
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold transition-colors shadow-sm"
              >
                <Copy className="h-3.5 w-3.5 text-indigo-600" />
                {copied ? "コピー済み" : "リンクをコピー"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
