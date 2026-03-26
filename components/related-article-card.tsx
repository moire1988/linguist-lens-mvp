"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ArticleSummary } from "@/lib/article-types";
import {
  getArticleCategoryBadgeClass,
  getArticleCategoryDisplayLabel,
} from "@/lib/article-categories";
import { articleDisplayTitles } from "@/lib/article-display";
import { FavoriteFakeDoorButton } from "@/components/favorite-fake-door-button";

const CEFR_STYLE: Record<string, string> = {
  A1: "bg-slate-100  text-slate-600  border-slate-200",
  A2: "bg-green-100  text-green-700  border-green-200",
  B1: "bg-blue-100   text-blue-700   border-blue-200",
  B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  C1: "bg-purple-100 text-purple-700 border-purple-200",
  C2: "bg-rose-100   text-rose-700   border-rose-200",
};

export function RelatedArticleCard({ article }: { article: ArticleSummary }) {
  const cefrStyle = CEFR_STYLE[article.level] ?? CEFR_STYLE.B2;
  const titles = articleDisplayTitles(article);
  const catClass = article.category
    ? getArticleCategoryBadgeClass(article.category)
    : null;

  return (
    <div className="relative">
      <Link
        href={`/articles/${article.slug}`}
        className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 pr-11 transition-all duration-150 hover:border-indigo-300 hover:bg-indigo-50/20"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold",
              cefrStyle
            )}
          >
            {article.level}
          </span>
          {catClass && (
            <span
              className={cn(
                "max-w-[140px] truncate rounded border px-1.5 py-0.5 font-mono text-[10px]",
                catClass
              )}
            >
              {getArticleCategoryDisplayLabel(article.category)}
            </span>
          )}
        </div>
        <p className="line-clamp-2 font-mono text-sm font-bold leading-snug text-slate-800 transition-colors group-hover:text-indigo-700">
          {titles.primary}
        </p>
        {titles.secondary && (
          <p className="line-clamp-1 text-xs leading-snug text-slate-500">
            {titles.secondary}
          </p>
        )}
      </Link>
      <div className="absolute right-2 top-2 z-10">
        <FavoriteFakeDoorButton />
      </div>
    </div>
  );
}
