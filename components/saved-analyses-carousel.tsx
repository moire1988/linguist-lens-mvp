"use client";

import {
  forwardRef,
  type RefObject,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Globe, FileText, Youtube, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractYouTubeVideoId } from "@/lib/youtube-url";
import {
  getAnalysisPublicStatusLabel,
  getSavedAnalysisCardTitle,
  type SavedAnalysis,
} from "@/lib/saved-analyses";

/** サムネ用: YouTube ドメインかつ動画 ID があるときだけ動画サムネ（他ドメインの v= 誤検出でグレー化しない） */
function resolveYoutubeThumbMeta(sourceUrl: string | undefined | null): {
  videoId: string | null;
} {
  const raw = sourceUrl?.trim();
  if (!raw) return { videoId: null };
  try {
    const h = new URL(raw).hostname.replace(/^www\./, "");
    const onYoutubeHost =
      h === "youtu.be" ||
      h.endsWith("youtube.com") ||
      h.endsWith("youtube-nocookie.com");
    if (!onYoutubeHost) return { videoId: null };
    const id = extractYouTubeVideoId(raw);
    return { videoId: id };
  } catch {
    return { videoId: null };
  }
}

const LEVEL_STYLES: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600 border-slate-300",
  A2: "bg-green-50 text-green-700 border-green-200",
  B1: "bg-blue-50 text-blue-700 border-blue-200",
  B2: "bg-indigo-50 text-indigo-700 border-indigo-200",
  C1: "bg-purple-50 text-purple-700 border-purple-200",
  C2: "bg-rose-50 text-rose-700 border-rose-200",
};

const CARD_W = 256;
const GAP = 12;

export function SavedAnalysesCarouselNavButtons({
  scrollRef,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = CARD_W + GAP;
    el.scrollTo({
      left: el.scrollLeft + (dir === "right" ? amount : -amount),
      behavior: "smooth",
    });
  };

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors shadow-sm"
        aria-label="前へ"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors shadow-sm"
        aria-label="次へ"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export const SavedAnalysesCarouselTrack = forwardRef<
  HTMLDivElement,
  {
    items: SavedAnalysis[];
    onDelete: (id: string) => void;
  }
>(function SavedAnalysesCarouselTrack({ items, onDelete }, ref) {
  if (items.length === 0) return null;

  return (
    <div
      ref={ref}
      className="flex gap-3 overflow-x-auto snap-x scrollbar-hide pb-1 -mx-4 sm:mx-0 px-4 sm:px-0"
    >
      {items.map((analysis) => {
        const { videoId: ytId } = resolveYoutubeThumbMeta(analysis.sourceUrl);
        const isYt = ytId !== null;
        const isWebThumb =
          !isYt &&
          (Boolean(analysis.sourceUrl?.trim()) ||
            analysis.data.source_type === "web");
        const displayTitle = getSavedAnalysisCardTitle(analysis);
        const phrases = analysis.data.phrases ?? [];
        const previewLen = phrases.length;
        const resolvedTotal =
          typeof analysis.data.total_count === "number" &&
          Number.isFinite(analysis.data.total_count)
            ? analysis.data.total_count
            : previewLen;
        const showSonota = resolvedTotal > 2 || previewLen > 2;
        const level = analysis.cefrLevel;

        return (
          <div
            key={analysis.id}
            className="relative snap-start shrink-0 w-[256px]"
          >
            <Link
              href={`/analyses/${analysis.id}`}
              className={cn(
                "block overflow-hidden rounded-xl",
                "border border-slate-200 bg-white shadow-sm",
                "hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-md",
                "transition-all duration-200 group"
              )}
            >
              <div
                className={cn(
                  "relative h-[144px] overflow-hidden",
                  isYt
                    ? "bg-slate-100"
                    : isWebThumb
                      ? "bg-sky-50"
                      : "bg-violet-50"
                )}
              >
                {isYt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt={displayTitle}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : isWebThumb ? (
                  <div className="flex h-full min-h-[144px] w-full items-center justify-center bg-sky-50">
                    <Globe className="h-12 w-12 text-sky-300" />
                  </div>
                ) : (
                  <div className="flex h-full min-h-[144px] w-full items-center justify-center bg-violet-50">
                    <FileText className="h-12 w-12 text-violet-300" />
                  </div>
                )}
                {/* 動画サムネ用のみ。URL/テキストの薄色背景はグラデで潰さない */}
                {isYt ? (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                ) : null}

                <span
                  className={cn(
                    "absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border bg-white/90 backdrop-blur-sm",
                    LEVEL_STYLES[level] ?? LEVEL_STYLES.B1
                  )}
                >
                  {level}
                </span>
                {isYt && (
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border bg-white/90 backdrop-blur-sm text-red-600 border-red-200 flex items-center gap-0.5">
                    <Youtube className="h-2.5 w-2.5" />
                    YouTube
                  </span>
                )}
              </div>

              <div className="p-3">
                <p className="text-slate-700 font-mono text-xs font-semibold leading-snug line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">
                  {displayTitle}
                </p>
                <p className="text-slate-400 text-[10px] font-mono truncate mb-2">
                  {new Date(analysis.savedAt).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                </p>

                <div className="space-y-0.5 mb-2 min-h-[2.25rem]">
                  {phrases.slice(0, 2).map((phrase, i) => (
                    <p
                      key={i}
                      className="text-[11px] text-slate-600 truncate"
                    >
                      · {phrase.expression}
                    </p>
                  ))}
                  {showSonota && (
                    <p className="text-[10px] text-slate-400">そのほか</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      analysis.isPublic === true
                        ? "text-indigo-600"
                        : analysis.publicReviewRequested === true
                          ? "text-amber-700"
                          : "text-slate-400"
                    )}
                  >
                    {getAnalysisPublicStatusLabel(analysis)}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 group-hover:text-indigo-600 transition-colors">
                    詳しく見る →
                  </span>
                </div>
              </div>
            </Link>
            <button
              type="button"
              className="absolute right-2 top-2 z-20 p-1.5 rounded-lg border border-slate-200/90 bg-white/95 text-slate-400 shadow-sm hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors"
              aria-label="この解析を削除"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(analysis.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
});
