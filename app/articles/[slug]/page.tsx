import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getRelatedArticles } from "@/lib/db/articles";
import { CefrBadge } from "@/components/cefr-badge";
import { VariantBadge } from "@/components/variant-badge";
import { AdBanner } from "@/components/ad-banner";
import { ArticleTts } from "@/components/article-tts";
import { ArticleBody, ArticleVocabCard } from "@/components/article-body";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import { NewsletterBanner } from "@/components/newsletter-banner";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  getArticleCategoryBadgeClass,
  getArticleCategoryDisplayLabel,
} from "@/lib/article-categories";
import { articleDisplayTitles } from "@/lib/article-display";
import { cn } from "@/lib/utils";
import { FavoriteFakeDoorButton } from "@/components/favorite-fake-door-button";
import { RelatedArticleCard } from "@/components/related-article-card";
import { getPublicSiteUrl } from "@/lib/site-url";

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: "ページが見つかりません" };

  const seoTitle    = article.titleJa
    ? `${article.titleJa} | LinguistLens`
    : `${article.titleEn} | LinguistLens`;
  const description = `${article.level}レベルの英語学習記事。語彙ハイライト付きで重要表現を自然に身につけられます。日本語訳・単語リスト付き。`;
  const canonical   = `${getPublicSiteUrl()}/articles/${article.slug}`;

  return {
    title: seoTitle,
    description,
    openGraph: {
      type:        "article",
      url:         canonical,
      title:       seoTitle,
      description,
      images: [{ url: "/og", width: 1200, height: 630 }],
      publishedTime: article.publishedAt ?? undefined,
    },
    twitter: {
      card:        "summary_large_image",
      title:       seoTitle,
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

  const related = await getRelatedArticles(
    article.slug,
    article.level,
    article.category
  );
  const titles = articleDisplayTitles(article);

  return (
    <div className="min-h-screen relative">
      <SiteHeader maxWidth="5xl" right={<GlobalNav showVocabularyLink />} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Learning Articles", href: "/articles" },
            { label: titles.primary },
          ]}
        />

        {/* Meta */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <CefrBadge level={article.level} />
          <VariantBadge variant={article.englishVariant} />
          {article.category && (
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded border",
              getArticleCategoryBadgeClass(article.category)
            )}>
              {getArticleCategoryDisplayLabel(article.category)}
            </span>
          )}
          <span className="text-xs text-slate-400">
            {new Date(article.publishedAt!).toLocaleDateString("ja-JP")}
          </span>
          <span className="ml-auto flex items-center">
            <FavoriteFakeDoorButton size="md" />
          </span>
        </div>

        {/* Title block */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight leading-tight">
            {titles.primary}
          </h1>
          {titles.secondary && (
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {titles.secondary}
            </p>
          )}
        </div>

        {/* TTS（ログイン済みのみ表示） */}
        <ArticleTts contentHtml={article.contentHtml} englishVariant={article.englishVariant} />

        {/* Article body（語彙ハイライト・ポップアップ付き） */}
        <ArticleBody
          contentHtml={article.contentHtml}
          articleLevel={article.level}
          articleTitle={titles.primary}
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
                  articleTitle={titles.primary}
                  englishVariant={article.englishVariant}
                />
              ))}
            </div>
          </section>
        )}

        {/* Cultural Tip */}
        {article.culturalTip && (
          <section className="mb-10 bg-violet-50 border border-violet-200 rounded-2xl p-5 sm:p-6">
            <h2 className="text-base font-bold text-violet-700 mb-3 flex items-center gap-2">
              💡 豆知識（Cultural Tip）
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{article.culturalTip}</p>
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

        {/* Newsletter */}
        <div className="mb-10">
          <NewsletterBanner variant="compact" />
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-700">
                同じ{article.level}レベルの記事
              </h2>
              <Link
                href="/articles"
                className="text-[11px] font-mono text-indigo-400 hover:text-indigo-600 transition-colors"
              >
                一覧をみる →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map((r) => (
                <RelatedArticleCard key={r.id} article={r} />
              ))}
            </div>
          </section>
        )}

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


    </div>
  );
}
