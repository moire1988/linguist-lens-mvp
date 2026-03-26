"use client";

import { useState } from "react";
import Link from "next/link";
import type { ArticleSummary, EnglishVariant } from "@/lib/article-types";
import {
  getArticleCategoryBadgeClass,
  getArticleCategoryDisplayLabel,
} from "@/lib/article-categories";
import { articleDisplayTitles } from "@/lib/article-display";
import { cn } from "@/lib/utils";
import { FavoriteFakeDoorButton } from "@/components/favorite-fake-door-button";

// ─── Styles ───────────────────────────────────────────────────────────────────

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
// "common" はボタンに表示しない（フィルター選択時に OR 条件で自動包含される）
const SELECTABLE_VARIANTS: Exclude<EnglishVariant, "common">[] = ["US", "UK", "AU"];

// ─── Filter row ───────────────────────────────────────────────────────────────

function FilterRow({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pt-1.5 w-12 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
              active === opt.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: ArticleSummary }) {
  const catClass = article.category
    ? getArticleCategoryBadgeClass(article.category)
    : null;
  const titles = articleDisplayTitles(article);
  const cefrStyle = CEFR_STYLE[article.level] ?? CEFR_STYLE.B2;
  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("ja-JP", {
        year: "numeric", month: "numeric", day: "numeric",
      })
    : "";

  return (
    <div className="relative">
      <Link
        href={`/articles/${article.slug}`}
        className="group block rounded-xl border border-slate-200 bg-white p-4 pr-12 transition-all duration-150 hover:border-indigo-300 hover:bg-indigo-50/20 sm:p-5"
      >
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <span className={cn("rounded border px-2 py-0.5 font-mono text-[10px] font-bold", cefrStyle)}>
            {article.level}
          </span>
          {article.englishVariant && (
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
              {VARIANT_LABEL[article.englishVariant]}
            </span>
          )}
          {catClass && (
            <span className={cn("max-w-[200px] truncate rounded border px-2 py-0.5 font-mono text-[10px] font-semibold", catClass)}>
              {getArticleCategoryDisplayLabel(article.category)}
            </span>
          )}
          <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-400">{dateStr}</span>
        </div>
        <p className="font-mono text-sm font-bold leading-snug text-slate-800 transition-colors group-hover:text-indigo-700">
          {titles.primary}
        </p>
        {titles.secondary && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{titles.secondary}</p>
        )}
        {article.keyword && (
          <p className="mt-2.5 font-mono text-[10px] text-slate-400">🔑 {article.keyword}</p>
        )}
      </Link>
      <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
        <FavoriteFakeDoorButton />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ArticleListClient({ articles }: { articles: ArticleSummary[] }) {
  const [levelFilter, setLevelFilter]    = useState("all");
  const [variantFilter, setVariantFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = articles.filter((a) => {
    if (levelFilter !== "all" && a.level !== levelFilter) return false;
    // US/UK/AU 選択時は common 記事も含める（OR 条件）
    if (variantFilter !== "all") {
      const match = a.englishVariant === variantFilter || a.englishVariant === "common";
      if (!match) return false;
    }
    if (
      categoryFilter !== "all" &&
      getArticleCategoryDisplayLabel(a.category) !== categoryFilter
    )
      return false;
    return true;
  });

  const hasFilter = levelFilter !== "all" || variantFilter !== "all" || categoryFilter !== "all";

  // 正規化ラベルでユニーク化（旧 DB 文字列が混在しても1チップにまとまる）
  const existingCategories = Array.from(
    new Set(
      articles
        .map((a) => getArticleCategoryDisplayLabel(a.category))
        .filter((c) => c !== "")
    )
  ).sort((a, b) => a.localeCompare(b, "ja"));

  const levelOptions   = [{ value: "all", label: "すべて" }, ...LEVELS.filter((l) => articles.some((a) => a.level === l)).map((l) => ({ value: l, label: l }))];
  // common は選択肢に出さない。ボタンは すべて / US / UK / AU のみ
  const variantOptions = [
    { value: "all", label: "すべて" },
    ...SELECTABLE_VARIANTS
      .filter((v) => articles.some((a) => a.englishVariant === v || a.englishVariant === "common"))
      .map((v) => ({ value: v, label: VARIANT_LABEL[v] })),
  ];
  const categoryOptions = [
    { value: "all", label: "すべて" },
    ...existingCategories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <>
      {/* Filter panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 space-y-3">
        <FilterRow label="レベル"   options={levelOptions}    active={levelFilter}    onChange={setLevelFilter}    />
        <FilterRow label="言語"     options={variantOptions}  active={variantFilter}  onChange={setVariantFilter}  />
        {existingCategories.length > 0 && (
          <FilterRow label="カテゴリ" options={categoryOptions} active={categoryFilter} onChange={setCategoryFilter} />
        )}

        {/* Active filter count + reset */}
        {hasFilter && (
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">
              {filtered.length} / {articles.length} 件
            </span>
            <button
              onClick={() => { setLevelFilter("all"); setVariantFilter("all"); setCategoryFilter("all"); }}
              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-600 transition-colors underline underline-offset-2"
            >
              フィルターをリセット
            </button>
          </div>
        )}
      </div>

      {/* Count (no filter active) */}
      {!hasFilter && (
        <p className="text-[10px] font-mono text-slate-400 mb-3">{articles.length} articles</p>
      )}

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
