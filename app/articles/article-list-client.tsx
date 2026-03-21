"use client";

import { useState } from "react";
import Link from "next/link";
import type { ArticleSummary, EnglishVariant } from "@/lib/article-types";
import { cn } from "@/lib/utils";

// ─── Styles ───────────────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, string> = {
  "Tech & Startup":              "bg-sky-50    text-sky-700    border-sky-200",
  "Pop Culture & Entertainment": "bg-pink-50   text-pink-700   border-pink-200",
  "Lifehacks & Psychology":      "bg-amber-50  text-amber-700  border-amber-200",
  "Real Parenting & Family":     "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Local Travel Secrets":        "bg-violet-50 text-violet-700 border-violet-200",
};

const CEFR_STYLE: Record<string, string> = {
  A1: "bg-slate-100  text-slate-600  border-slate-200",
  A2: "bg-green-100  text-green-700  border-green-200",
  B1: "bg-blue-100   text-blue-700   border-blue-200",
  B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  C1: "bg-purple-100 text-purple-700 border-purple-200",
  C2: "bg-rose-100   text-rose-700   border-rose-200",
};

const VARIANT_LABEL: Record<EnglishVariant, string> = {
  US: "🇺🇸 US", UK: "🇬🇧 UK", AU: "🇦🇺 AU", common: "🌐 共通",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const VARIANTS: EnglishVariant[] = ["US", "UK", "AU", "common"];

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: ArticleSummary }) {
  const catStyle = article.category
    ? (CATEGORY_STYLE[article.category] ?? "bg-slate-50 text-slate-600 border-slate-200")
    : null;
  const cefrStyle = CEFR_STYLE[article.level] ?? CEFR_STYLE.B2;
  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" })
    : "";

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20 rounded-xl p-4 sm:p-5 transition-all duration-150"
    >
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded border", cefrStyle)}>
          {article.level}
        </span>
        {catStyle && (
          <span className={cn("text-[10px] font-mono font-semibold px-2 py-0.5 rounded border truncate max-w-[200px]", catStyle)}>
            {article.category}
          </span>
        )}
        <span className="ml-auto text-[10px] font-mono text-slate-400 shrink-0">{dateStr}</span>
      </div>
      <p className="text-sm font-bold font-mono text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors">
        {article.titleEn}
      </p>
      {article.titleJa && (
        <p className="text-xs text-slate-500 leading-relaxed mt-1">{article.titleJa}</p>
      )}
      {article.keyword && (
        <p className="mt-2.5 text-[10px] font-mono text-slate-400">🔑 {article.keyword}</p>
      )}
    </Link>
  );
}

// ─── Filter pills ─────────────────────────────────────────────────────────────

function FilterPills<T extends string>({
  options,
  active,
  onChange,
}: {
  options: { value: T; label: string; count: number }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
            active === opt.value
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
          )}
        >
          {opt.label}
          <span className={cn("ml-1.5 font-bold", active === opt.value ? "text-indigo-200" : "text-slate-400")}>
            {opt.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ArticleListClient({ articles }: { articles: ArticleSummary[] }) {
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [variantFilter, setVariantFilter] = useState<string>("all");

  const filtered = articles.filter((a) => {
    if (levelFilter !== "all" && a.level !== levelFilter) return false;
    if (variantFilter !== "all" && a.englishVariant !== variantFilter) return false;
    return true;
  });

  const levelOptions = [
    { value: "all", label: "すべて", count: articles.length },
    ...LEVELS
      .filter((l) => articles.some((a) => a.level === l))
      .map((l) => ({ value: l, label: l, count: articles.filter((a) => a.level === l).length })),
  ] as { value: string; label: string; count: number }[];

  const variantOptions = [
    { value: "all", label: "すべて", count: articles.length },
    ...VARIANTS
      .filter((v) => articles.some((a) => a.englishVariant === v))
      .map((v) => ({ value: v, label: VARIANT_LABEL[v], count: articles.filter((a) => a.englishVariant === v).length })),
  ] as { value: string; label: string; count: number }[];

  return (
    <>
      {/* Filters */}
      <div className="space-y-3 mb-6">
        <FilterPills options={levelOptions} active={levelFilter} onChange={setLevelFilter} />
        <FilterPills options={variantOptions} active={variantFilter} onChange={setVariantFilter} />
      </div>

      {/* Count */}
      <p className="text-[10px] font-mono text-slate-400 mb-3">
        {filtered.length} / {articles.length} articles
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm font-mono">
          該当する記事がありません。
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </>
  );
}
