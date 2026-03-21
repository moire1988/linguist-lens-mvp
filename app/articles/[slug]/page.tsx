import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/db/articles";
import { CefrBadge } from "@/components/cefr-badge";
import { VariantBadge } from "@/components/variant-badge";
import { AdBanner } from "@/components/ad-banner";
import { ArticleTts } from "@/components/article-tts";
import { ArticleBody, ArticleVocabCard } from "@/components/article-body";
import { ArticleHeader } from "@/components/article-header";
import { SiteFooter } from "@/components/site-footer";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const SITE_URL = "https://linguist-lens-mvp.vercel.app";

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: "ページが見つかりません" };

  const title       = `${article.title} | LinguistLens`;
  const description = `${article.level}レベルの英語学習記事。語彙ハイライト付きで重要表現を自然に身につけられます。日本語訳・単語リスト付き。`;
  const canonical   = `${SITE_URL}/articles/${article.slug}`;

  return {
    title,
    description,
    openGraph: {
      type:        "article",
      url:         canonical,
      title,
      description,
      images: [{ url: "/og", width: 1200, height: 630 }],
      publishedTime: article.publishedAt ?? undefined,
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
      images:      ["/og"],
    },
    alternates: { canonical },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen relative">
      <ArticleHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <CefrBadge level={article.level} />
          <VariantBadge variant={article.englishVariant} />
          <span className="text-xs text-slate-400">
            {new Date(article.publishedAt!).toLocaleDateString("ja-JP")}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          {article.title}
        </h1>

        {/* TTS（ログイン済みのみ表示） */}
        <ArticleTts contentHtml={article.contentHtml} englishVariant={article.englishVariant} />

        {/* Article body（語彙ハイライト・ポップアップ付き） */}
        <ArticleBody
          contentHtml={article.contentHtml}
          articleLevel={article.level}
          articleTitle={article.title}
          englishVariant={article.englishVariant}
        />

        {/* Ad */}
        <AdBanner className="mb-10" />

        {/* Vocabulary list */}
        {article.vocabularyList.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              重要語彙 {article.vocabularyList.length}語
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.vocabularyList.map((item, i) => (
                <ArticleVocabCard
                  key={i}
                  item={item}
                  articleLevel={article.level}
                  articleTitle={article.title}
                  englishVariant={article.englishVariant}
                />
              ))}
            </div>
          </section>
        )}

        {/* Japanese translation */}
        <section className="mb-12 bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-700 mb-4">日本語訳</h2>
          <div
            className="prose prose-sm max-w-none text-slate-600 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.translationHtml }}
          />
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 text-center text-white">
          <h2 className="text-xl font-extrabold mb-2">
            あなたのレベルで英語コンテンツを解析しよう
          </h2>
          <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
            YouTubeやWeb記事のURLを貼るだけ。<br />
            AIがあなたのCEFRレベルに合わせて重要フレーズを自動抽出・日本語解説します。
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
          >
            無料で始める →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
