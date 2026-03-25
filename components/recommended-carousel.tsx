"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RECOMMENDED_VIDEOS,
  type VideoCategory,
} from "@/lib/recommended-videos-data";

// ─── Style maps ──────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600 border-slate-300",
  A2: "bg-green-50 text-green-700 border-green-200",
  B1: "bg-blue-50 text-blue-700 border-blue-200",
  B2: "bg-indigo-50 text-indigo-700 border-indigo-200",
  C1: "bg-purple-50 text-purple-700 border-purple-200",
  C2: "bg-rose-50 text-rose-700 border-rose-200",
};

const CATEGORY_STYLES: Record<VideoCategory, string> = {
  TED:     "bg-red-50 text-red-600 border-red-200",
  Speech:  "bg-amber-50 text-amber-700 border-amber-200",
  Vlog:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  News:    "bg-sky-50 text-sky-700 border-sky-200",
  Podcast: "bg-violet-50 text-violet-700 border-violet-200",
};

const CARD_W = 256; // px — sync with w-[256px] below
const GAP    = 12;  // px — sync with gap-3 below

// ─── Component ───────────────────────────────────────────────────────────────

export function RecommendedCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // scrollTo is more reliable than scrollBy with snap-x
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = CARD_W + GAP;
    el.scrollTo({
      left: el.scrollLeft + (dir === "right" ? amount : -amount),
      behavior: "smooth",
    });
  };

  const items = RECOMMENDED_VIDEOS;

  return (
    <section className="border-t border-slate-100 bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
              Examples
            </p>
            <h2 className="text-sm font-semibold text-slate-700">
              まずは人気の動画で試す
            </h2>
          </div>

          {/* Prev / Next — desktop only */}
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

        {/* Scroll track */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x scrollbar-hide pb-1 -mx-4 sm:mx-0 px-4 sm:px-0"
        >
          {items.map((v, i) => {
            const isEmpty = !v.title;

            // ── Empty placeholder ───────────────────────────────────────────
            if (isEmpty) {
              return (
                <div
                  key={`placeholder-${i}`}
                  className="snap-start shrink-0 w-[256px] rounded-xl bg-white border border-slate-200 overflow-hidden opacity-40"
                >
                  <div className="h-[144px] bg-slate-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-3/4 bg-slate-100 rounded" />
                    <div className="h-2.5 w-1/2 bg-slate-100 rounded" />
                  </div>
                </div>
              );
            }

            // ── Coming Soon (has metadata, no page yet) ─────────────────────
            if (!v.ready) {
              return (
                <div
                  key={v.slug || `coming-${i}`}
                  className="snap-start shrink-0 w-[256px] rounded-xl bg-white border border-slate-200 overflow-hidden relative"
                >
                  {/* Thumbnail */}
                  <div className="relative h-[144px] bg-slate-100 overflow-hidden">
                    {v.youtubeId && (
                      <img
                        src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                        alt={v.title}
                        className="w-full h-full object-cover opacity-40 grayscale"
                      />
                    )}
                    {/* Coming Soon badge */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-2.5 py-1 bg-slate-800/70 backdrop-blur-sm text-white text-[10px] font-mono font-bold rounded-full">
                        準備中
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-slate-400 font-mono text-xs font-semibold leading-snug line-clamp-2 mb-1">
                      {v.title}
                    </p>
                    {v.sublabel && (
                      <p className="text-slate-300 text-[10px] font-mono truncate">
                        {v.sublabel}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            // ── Ready card (clickable link) ─────────────────────────────────
            return (
              <Link
                key={v.slug}
                href={`/examples/${v.slug}`}
                className={cn(
                  "snap-start shrink-0 w-[256px] rounded-xl overflow-hidden",
                  "bg-white border border-slate-200 shadow-sm",
                  "hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5",
                  "transition-all duration-200 group"
                )}
              >
                {/* Thumbnail */}
                <div className="relative h-[144px] bg-slate-100 overflow-hidden">
                  {v.youtubeId && (
                    <img
                      src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  {/* Level badge — bottom left */}
                  <span
                    className={cn(
                      "absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border bg-white/90 backdrop-blur-sm",
                      LEVEL_STYLES[v.level] ?? LEVEL_STYLES["B1"]
                    )}
                  >
                    {v.level}
                  </span>

                  {/* Category badge — bottom right */}
                  <span
                    className={cn(
                      "absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border bg-white/90 backdrop-blur-sm",
                      CATEGORY_STYLES[v.category]
                    )}
                  >
                    {v.category}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-3">
                  <p className="text-slate-700 font-mono text-xs font-semibold leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                    {v.title}
                  </p>
                  {v.sublabel && (
                    <p className="text-slate-400 text-[10px] font-mono truncate mb-2">
                      {v.sublabel}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      {v.cefrRange}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 group-hover:text-indigo-600 transition-colors">
                      解析を見る →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
