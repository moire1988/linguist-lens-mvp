import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublishedArticles } from "@/lib/db/articles";
import type { ArticleSummary } from "@/lib/article-types";
import { ArticleHeader } from "@/components/article-header";
import { SiteFooter } from "@/components/site-footer";
import { NewsletterBanner } from "@/components/newsletter-banner";
import { cn } from "@/lib/utils";

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "英語学習記事一覧 | LinguistLens",
  description:
    "CEFRレベル別の英語学習記事ライブラリ。AIが生成した語彙ハイライト・日本語訳付きの記事でリアルな英語表現を効率よく習得。",
};

// ─── Category badge ───────────────────────────────────────────────────────────

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

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: ArticleSummary }) {
  const catStyle = article.category
    ? (CATEGORY_STYLE[article.category] ?? "bg-slate-50 text-slate-600 border-slate-200")
    : null;
  const cefrStyle = CEFR_STYLE[article.level] ?? CEFR_STYLE.B2;

  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })
    : "";

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20 rounded-xl p-4 sm:p-5 transition-all duration-150"
    >
      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        {/* CEFR */}
        <span
          className={cn(
            "text-[10px] font-mono font-bold px-2 py-0.5 rounded border",
            cefrStyle
          )}
        >
          {article.level}
        </span>

        {/* Category */}
        {catStyle && (
          <span
            className={cn(
              "text-[10px] font-mono font-semibold px-2 py-0.5 rounded border truncate max-w-[200px]",
              catStyle
            )}
          >
            {article.category}
          </span>
        )}

        {/* Date */}
        <span className="ml-auto text-[10px] font-mono text-slate-400 shrink-0">
          {dateStr}
        </span>
      </div>

      {/* English title */}
      <p className="text-sm font-bold font-mono text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors">
        {article.titleEn}
      </p>

      {/* Japanese title */}
      {article.titleJa && (
        <p className="text-xs text-slate-500 leading-relaxed mt-1">
          {article.titleJa}
        </p>
      )}

      {/* Keyword */}
      {article.keyword && (
        <p className="mt-2.5 text-[10px] font-mono text-slate-400">
          🔑 {article.keyword}
        </p>
      )}
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlesPage() {
  const articles = await getAllPublishedArticles();

  return (
    <div className="min-h-screen relative">
      <ArticleHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Page header */}
        <div className="mb-8">
          <p className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-widest mb-2">
            Library
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
            英語学習記事
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            AIが生成したCEFRレベル別の英語記事。語彙ハイライト・日本語訳付き。
          </p>
        </div>

        {/* Newsletter */}
        <div className="mb-10">
          <NewsletterBanner />
        </div>

        {/* Article list */}
        {articles.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm font-mono">
            記事はまだ公開されていません。
          </div>
        ) : (
          <>
            <p className="text-[10px] font-mono text-slate-400 mb-3">
              {articles.length} articles
            </p>
            <div className="space-y-2.5">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
