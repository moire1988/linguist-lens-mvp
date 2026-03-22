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
  A1: "bg-slate-800/90 text-slate-300 border-slate-600",
  A2: "bg-green-950/90 text-green-400 border-green-800",
  B1: "bg-blue-950/90 text-blue-400 border-blue-800",
  B2: "bg-indigo-950/90 text-indigo-400 border-indigo-800",
  C1: "bg-purple-950/90 text-purple-400 border-purple-800",
  C2: "bg-rose-950/90 text-rose-400 border-rose-800",
};

const CATEGORY_STYLES: Record<VideoCategory, string> = {
  TED:     "text-red-400 border-red-500/40 bg-red-950/80",
  Speech:  "text-amber-400 border-amber-500/40 bg-amber-950/80",
  Vlog:    "text-emerald-400 border-emerald-500/40 bg-emerald-950/80",
  News:    "text-sky-400 border-sky-500/40 bg-sky-950/80",
  Podcast: "text-violet-400 border-violet-500/40 bg-violet-950/80",
};

const CARD_W = 260; // px — sync with w-[260px] below
const GAP    = 12;  // px — sync with gap-3 below

// ─── Component ───────────────────────────────────────────────────────────────

export function RecommendedCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "right" ? CARD_W + GAP : -(CARD_W + GAP),
      behavior: "smooth",
    });
  };

  const active = RECOMMENDED_VIDEOS.filter((v) => v.slug);
  const placeholder = RECOMMENDED_VIDEOS.filter((v) => !v.slug);

  return (
    <section className="bg-slate-950 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-0.5">
              Examples
            </p>
            <h2 className="text-sm font-semibold text-slate-200">
              まずは人気の動画で試す
            </h2>
          </div>

          {/* Prev / Next — desktop only */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
              aria-label="前へ"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
              aria-label="次へ"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scroll track */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 sm:mx-0 px-4 sm:px-0"
        >
          {/* Active cards */}
          {active.map((v) => (
            <Link
              key={v.slug}
              href={`/examples/${v.slug}`}
              className={cn(
                "snap-start shrink-0 w-[260px] rounded-xl overflow-hidden",
                "bg-slate-900 border border-slate-700/50",
                "hover:border-indigo-500/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10",
                "transition-all duration-200 group"
              )}
            >
              {/* Thumbnail */}
              <div className="relative h-[146px] bg-slate-800 overflow-hidden">
                {v.youtubeId ? (
                  <img
                    src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                {/* Level badge */}
                <span
                  className={cn(
                    "absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border backdrop-blur-sm",
                    LEVEL_STYLES[v.level] ?? LEVEL_STYLES["B1"]
                  )}
                >
                  {v.level}
                </span>

                {/* Category badge */}
                <span
                  className={cn(
                    "absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border backdrop-blur-sm",
                    CATEGORY_STYLES[v.category]
                  )}
                >
                  {v.category}
                </span>
              </div>

              {/* Card body */}
              <div className="p-3">
                <p className="text-slate-200 font-mono text-xs font-semibold leading-snug line-clamp-2 mb-1 group-hover:text-indigo-300 transition-colors">
                  {v.title}
                </p>
                {v.sublabel && (
                  <p className="text-slate-600 text-[10px] font-mono truncate mb-2">
                    {v.sublabel}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-600">
                    {v.cefrRange}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-500 group-hover:text-indigo-400 transition-colors">
                    解析を見る →
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Placeholder cards */}
          {placeholder.map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="snap-start shrink-0 w-[260px] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 opacity-40"
            >
              <div className="h-[146px] bg-slate-800/50" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 bg-slate-800 rounded" />
                <div className="h-2.5 w-1/2 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
