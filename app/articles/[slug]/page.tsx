import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getRelatedArticles } from "@/lib/db/articles";
import { CefrBadge } from "@/components/cefr-badge";
import { VariantBadge } from "@/components/variant-badge";
import { AdBanner } from "@/components/ad-banner";
import { ArticleTts } from "@/components/article-tts";
import { ArticleBody, ArticleVocabCard } from "@/components/article-body";
import { ArticleHeader } from "@/components/article-header";
import { NewsletterBanner } from "@/components/newsletter-banner";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import type { ArticleSummary } from "@/lib/article-types";
import {
  ARTICLE_CATEGORY_BADGE_STYLE,
  getArticleCategoryDisplayLabel,
} from "@/lib/article-categories";
import { cn } from "@/lib/utils";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const SITE_URL = "https://linguist-lens-mvp.vercel.app";

const CEFR_STYLE: Record<string, string> = {
  A1: "bg-slate-100  text-slate-600  border-slate-200",
  A2: "bg-green-100  text-green-700  border-green-200",
  B1: "bg-blue-100   text-blue-700   border-blue-200",
  B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  C1: "bg-purple-100 text-purple-700 border-purple-200",
  C2: "bg-rose-100   text-rose-700   border-rose-200",
};

// ─── Related article card ─────────────────────────────────────────────────────

function RelatedArticleCard({ article }: { article: ArticleSummary }) {
  const cefrStyle  = CEFR_STYLE[article.level]    ?? CEFR_STYLE.B2;
  const catStyle   = article.category
    ? (ARTICLE_CATEGORY_BADGE_STYLE[article.category] ?? "bg-slate-50 text-slate-600 border-slate-200")
    : null;

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col gap-2 border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20 rounded-xl p-4 transition-all duration-150"
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border", cefrStyle)}>
          {article.level}
        </span>
        {catStyle && (
          <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border truncate max-w-[140px]", catStyle)}>
            {getArticleCategoryDisplayLabel(article.category)}
          </span>
        )}
      </div>
      <p className="text-sm font-bold font-mono text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
        {article.titleEn}
      </p>
      {article.titleJa && (
        <p className="text-xs text-slate-500 leading-snug line-clamp-1">{article.titleJa}</p>
      )}
    </Link>
  );
}

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
  const canonical   = `${SITE_URL}/articles/${article.slug}`;

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

  return (
    <div className="min-h-screen relative">
      <ArticleHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Library", href: "/articles" },
            { label: article.titleEn },
          ]}
        />

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <CefrBadge level={article.level} />
          <VariantBadge variant={article.englishVariant} />
          {article.category && (
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded border",
              ARTICLE_CATEGORY_BADGE_STYLE[article.category] ?? "bg-slate-50 text-slate-600 border-slate-200"
            )}>
              {getArticleCategoryDisplayLabel(article.category)}
            </span>
          )}
          <span className="text-xs text-slate-400">
            {new Date(article.publishedAt!).toLocaleDateString("ja-JP")}
          </span>
        </div>

        {/* Title block */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight leading-tight">
            {article.titleEn}
          </h1>
          {article.titleJa && (
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {article.titleJa}
            </p>
          )}
        </div>

        {/* TTS（ログイン済みのみ表示） */}
        <ArticleTts contentHtml={article.contentHtml} englishVariant={article.englishVariant} />

        {/* Article body（語彙ハイライト・ポップアップ付き） */}
        <ArticleBody
          contentHtml={article.contentHtml}
          articleLevel={article.level}
          articleTitle={article.titleEn}
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
                  articleTitle={article.titleEn}
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

      <SiteFooter />
    </div>
  );
}
