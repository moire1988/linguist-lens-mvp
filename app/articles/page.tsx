import type { Metadata } from "next";
import { getAllPublishedArticles } from "@/lib/db/articles";
import { ArticleHeader } from "@/components/article-header";
import { NewsletterBanner } from "@/components/newsletter-banner";
import { ArticleListClient } from "./article-list-client";

// キャッシュを無効化して常に最新データを返す
export const dynamic = "force-dynamic";

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "英語学習記事一覧 | LinguistLens",
  description:
    "CEFRレベル別の英語学習記事ライブラリ。AIが生成した語彙ハイライト・日本語訳付きの記事でリアルな英語表現を効率よく習得。",
};

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

        {/* Article list with filters */}
        {articles.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm font-mono">
            記事はまだ公開されていません。
          </div>
        ) : (
          <ArticleListClient articles={articles} />
        )}
      </main>


    </div>
  );
}
