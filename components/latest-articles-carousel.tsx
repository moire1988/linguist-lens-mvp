"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLatestArticlesAction } from "@/app/actions/articles";
import type { ArticleSummary } from "@/lib/article-types";
import {
  getArticleCategoryBadgeClass,
  getArticleCategoryDisplayLabel,
} from "@/lib/article-categories";
import { articleDisplayTitles } from "@/lib/article-display";
import type { EnglishVariant } from "@/lib/article-types";
import { FavoriteFakeDoorButton } from "@/components/favorite-fake-door-button";

// ─── Style maps ──────────────────────────────────────────────────────────────

const VARIANT_LABEL: Record<EnglishVariant, { flag: string; short: string; color: string }> = {
  US:     { flag: "🇺🇸", short: "US",   color: "bg-blue-50 text-blue-700 border-blue-200" },
  UK:     { flag: "🇬🇧", short: "UK",   color: "bg-red-50 text-red-700 border-red-200" },
  AU:     { flag: "🇦🇺", short: "AU",   color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  common: { flag: "🌐",  short: "共通", color: "bg-slate-50 text-slate-500 border-slate-200" },
};

const LEVEL_STYLES: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600 border-slate-300",
  A2: "bg-green-50  text-green-700  border-green-200",
  B1: "bg-blue-50   text-blue-700   border-blue-200",
  B2: "bg-indigo-50 text-indigo-700 border-indigo-200",
  C1: "bg-purple-50 text-purple-700 border-purple-200",
  C2: "bg-rose-50   text-rose-700   border-rose-200",
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
    <section className="py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
              Learning Articles
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
            const catClass = article.category
              ? getArticleCategoryBadgeClass(article.category)
              : null;
            const titles = articleDisplayTitles(article);

            return (
              <div
                key={article.slug}
                className="relative snap-start shrink-0 w-[256px]"
              >
              <Link
                href={`/articles/${article.slug}`}
                className={cn(
                  "flex h-full flex-col overflow-hidden rounded-xl",
                  "border border-slate-200 bg-white shadow-sm",
                  "hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-md",
                  "transition-all duration-200 group"
                )}
              >
                <div className="flex flex-1 flex-col p-3.5 pr-11">
                  {/* Level + variant（カテゴリはタイトル下） */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border",
                        LEVEL_STYLES[article.level] ?? LEVEL_STYLES["B1"]
                      )}
                    >
                      {article.level}
                    </span>
                    {(() => {
                      const v = VARIANT_LABEL[article.englishVariant] ?? VARIANT_LABEL.common;
                      return (
                        <span className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border",
                          v.color
                        )}>
                          {v.flag} {v.short}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex flex-1 flex-col min-h-0">
                    <p className="text-slate-700 font-mono text-xs font-semibold leading-snug line-clamp-3 group-hover:text-indigo-600 transition-colors">
                      {titles.primary}
                    </p>

                    {catClass && article.category && (
                      <div className="mt-2">
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border truncate max-w-full",
                            catClass
                          )}
                        >
                          {getArticleCategoryDisplayLabel(article.category)}
                        </span>
                      </div>
                    )}
                  </div>

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
              <div className="absolute right-2 top-2 z-10">
                <FavoriteFakeDoorButton />
              </div>
              </div>
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
