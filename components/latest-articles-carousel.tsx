"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLatestArticlesAction } from "@/app/actions/articles";
import type { ArticleSummary } from "@/lib/article-types";

// ─── Style maps ──────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600 border-slate-300",
  A2: "bg-green-50  text-green-700  border-green-200",
  B1: "bg-blue-50   text-blue-700   border-blue-200",
  B2: "bg-indigo-50 text-indigo-700 border-indigo-200",
  C1: "bg-purple-50 text-purple-700 border-purple-200",
  C2: "bg-rose-50   text-rose-700   border-rose-200",
};

const CATEGORY_STYLES: Record<string, string> = {
  "Tech & Startup":              "bg-sky-50     text-sky-700     border-sky-200",
  "Pop Culture & Entertainment": "bg-pink-50    text-pink-700    border-pink-200",
  "Lifehacks & Psychology":      "bg-amber-50   text-amber-700   border-amber-200",
  "Real Parenting & Family":     "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Local Travel Secrets":        "bg-violet-50  text-violet-700  border-violet-200",
};

const CARD_W = 256;
const GAP    = 12;

// ─── Component ───────────────────────────────────────────────────────────────

export function LatestArticlesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    getLatestArticlesAction(10).then(setArticles);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = CARD_W + GAP;
    el.scrollTo({
      left: el.scrollLeft + (dir === "right" ? amount : -amount),
      behavior: "smooth",
    });
  };

  if (articles.length === 0) return null;

  return (
    <section className="border-t border-slate-100 bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Library
            </p>
            <h2 className="text-sm font-semibold text-slate-700">
              最新の学習記事
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
          {articles.map((article) => {
            const catStyle = article.category
              ? (CATEGORY_STYLES[article.category] ?? "bg-slate-50 text-slate-600 border-slate-200")
              : null;

            return (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className={cn(
                  "snap-start shrink-0 w-[256px] rounded-xl overflow-hidden",
                  "bg-white border border-slate-200 shadow-sm flex flex-col",
                  "hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5",
                  "transition-all duration-200 group"
                )}
              >
                <div className="p-3.5 flex-1 flex flex-col">
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border",
                        LEVEL_STYLES[article.level] ?? LEVEL_STYLES["B1"]
                      )}
                    >
                      {article.level}
                    </span>
                    {catStyle && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-mono border truncate max-w-[148px]",
                          catStyle
                        )}
                      >
                        {article.category}
                      </span>
                    )}
                  </div>

                  {/* English title */}
                  <p className="text-slate-700 font-mono text-xs font-semibold leading-snug line-clamp-3 mb-1.5 group-hover:text-indigo-600 transition-colors flex-1">
                    {article.titleEn}
                  </p>

                  {/* Japanese subtitle */}
                  {article.titleJa && (
                    <p className="text-slate-400 text-[10px] font-mono leading-snug line-clamp-1 mb-2">
                      {article.titleJa}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-mono text-slate-400">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString("ja-JP", {
                            month: "numeric",
                            day: "numeric",
                          })
                        : ""}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 group-hover:text-indigo-600 transition-colors">
                      記事を読む →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 一覧リンク */}
        <div className="flex justify-end mt-4">
          <Link
            href="/articles"
            className="text-xs font-mono text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            一覧で見る →
          </Link>
        </div>

      </div>
    </section>
  );
}
