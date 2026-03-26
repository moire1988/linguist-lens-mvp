"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Globe, FileText, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecentPublicAnalysis } from "@/lib/public-analyses-types";
import { FavoriteFakeDoorButton } from "@/components/favorite-fake-door-button";

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

export function CommunityAnalysesCarousel({
  items,
}: {
  items: RecentPublicAnalysis[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = CARD_W + GAP;
    el.scrollTo({
      left: el.scrollLeft + (dir === "right" ? amount : -amount),
      behavior: "smooth",
    });
  };

  if (items.length === 0) return null;

  return (
    <section className="border-t border-slate-100 bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
              Community
            </p>
            <h2 className="text-sm font-semibold text-slate-700">
              みんなの最新の解析
            </h2>
          </div>

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
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x scrollbar-hide pb-1 -mx-4 sm:mx-0 px-4 sm:px-0"
        >
          {items.map((item) => {
            const ytId =
              item.url?.match(/[?&]v=([^&]{11})/)?.[1] ??
              item.url?.match(/youtu\.be\/([^?&]{11})/)?.[1];
            const isYt = !!ytId;
            const displayTitle =
              (item.title?.trim() && item.title.trim()) ||
              (isYt ? "YouTube 動画" : item.url ? "Web記事" : "解析結果");
            const previewLen = item.phrases?.length ?? 0;
            const resolvedTotal =
              typeof item.phraseCount === "number" &&
              Number.isFinite(item.phraseCount)
                ? item.phraseCount
                : previewLen;
            /** プレビューは最大3件のため、総数や3件目の有無で「そのほか」を出す */
            const showSonota = resolvedTotal > 2 || previewLen > 2;

            return (
              <div
                key={item.id}
                className="relative snap-start shrink-0 w-[256px]"
              >
              <Link
                href={`/analyses/${item.id}`}
                className={cn(
                  "block overflow-hidden rounded-xl",
                  "border border-slate-200 bg-white shadow-sm",
                  "hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-md",
                  "transition-all duration-200 group"
                )}
              >
                <div className="relative h-[144px] bg-slate-100 overflow-hidden">
                  {ytId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                      alt={displayTitle}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : item.url ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <Globe className="h-12 w-12 text-slate-300" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <FileText className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  <span
                    className={cn(
                      "absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border bg-white/90 backdrop-blur-sm",
                      LEVEL_STYLES[item.level] ?? LEVEL_STYLES.B1
                    )}
                  >
                    {item.level}
                  </span>
                  {isYt && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border bg-white/90 backdrop-blur-sm text-red-600 border-red-200 flex items-center gap-0.5">
                      <Youtube className="h-2.5 w-2.5" />
                      YouTube
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <p className="text-slate-700 font-mono text-xs font-semibold leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                    {displayTitle}
                  </p>
                  <p className="text-slate-400 text-[10px] font-mono truncate mb-2">
                    {new Date(item.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                    })}
                  </p>

                  <div className="space-y-0.5 mb-2 min-h-[2.25rem]">
                    {item.phrases.slice(0, 2).map((phrase, i) => (
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
                    <span className="text-[10px] font-mono text-slate-400">
                      公開解析
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 group-hover:text-indigo-600 transition-colors">
                      詳しく見る →
                    </span>
                  </div>
                </div>
              </Link>
              <div className="absolute right-2 top-2 z-20">
                <FavoriteFakeDoorButton />
              </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
