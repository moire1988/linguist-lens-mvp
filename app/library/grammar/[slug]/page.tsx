import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import { Breadcrumb } from "@/components/breadcrumb";
import { CefrBadge } from "@/components/cefr-badge";
import { GrammarConceptCard } from "@/components/grammar/grammar-concept-card";
import { VerbPairCard } from "@/components/grammar/verb-pair-card";
import { GrammarSectionMarkdown } from "@/components/grammar/grammar-section-markdown";
import { GrammarPractice } from "@/components/grammar/grammar-practice";
import { GrammarCta } from "@/components/grammar/grammar-cta";
import {
  getGrammarLesson,
  getAllGrammarSlugs,
} from "@/lib/grammar-lesson";
import {
  buildGrammarLessonMetadataKeywords,
  buildGrammarLessonSchemaGraph,
} from "@/lib/grammar-lesson-structured-data";
import { getPublicSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";

export function generateStaticParams(): { slug: string }[] {
  return getAllGrammarSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const lesson = getGrammarLesson(params.slug);
  if (!lesson) return { title: "ページが見つかりません" };

  const canonical = `${getPublicSiteUrl()}/library/grammar/${lesson.slug}`;
  const title = lesson.seoTitle;
  const description = lesson.seoDescription;
  /** GEO: コアイメージ・セクション見出しを反映（本文由来の JSON-LD はページ側で注入） */
  const keywords = buildGrammarLessonMetadataKeywords(lesson);

  return {
    title,
    description,
    keywords,
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      images: [{ url: "/og", width: 1200, height: 630 }],
      publishedTime: lesson.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og"],
    },
    alternates: { canonical },
  };
}

const ING_VS_TO_CTA_HEADLINE =
  "実際のネイティブ音声で \"stop doing / stop to do\" を耳で確かめよう";

export default function GrammarLessonPage({
  params,
}: {
  params: { slug: string };
}) {
  const lesson = getGrammarLesson(params.slug);
  if (!lesson) notFound();

  const siteUrl = getPublicSiteUrl();
  const pageUrl = `${siteUrl}/library/grammar/${lesson.slug}`;
  const schemaGraph = buildGrammarLessonSchemaGraph({
    lesson,
    pageUrl,
    siteUrl,
  });
  const schemaJson = JSON.stringify(schemaGraph).replace(/</g, "\\u003c");

  const relatedLessons = lesson.relatedSlugs
    .map((s) => getGrammarLesson(s))
    .filter((l): l is NonNullable<typeof l> => l !== undefined);

  const ctaHeadline =
    lesson.slug === "ing-vs-to" ? ING_VS_TO_CTA_HEADLINE : undefined;

  return (
    <div className="min-h-screen relative">
      <Script
        id={`ll-grammar-schema-${lesson.slug}`}
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />
      <SiteHeader maxWidth="5xl" right={<GlobalNav showVocabularyLink />} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: "Library", href: "/library" },
            { label: "文法コアイメージ特集", href: "/library/grammar" },
            { label: lesson.h1 },
          ]}
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-full border",
              "border-amber-200 bg-amber-50 text-amber-900"
            )}
          >
            {lesson.category}
          </span>
          {lesson.targetLevels.map((lv) => (
            <CefrBadge key={lv} level={lv} size="sm" />
          ))}
        </div>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight leading-tight">
            {lesson.h1}
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {lesson.subtitle}
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400 font-mono">
            <span>読了目安: {lesson.readingMinutes} 分</span>
            <span>
              公開:{" "}
              {new Date(lesson.publishedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        <p className="text-sm text-slate-700 leading-relaxed mb-10 whitespace-pre-wrap">
          {lesson.intro}
        </p>

        <section className="mb-10">
          <h2 className="sr-only">コアイメージの比較</h2>
          {lesson.coreConcepts && lesson.coreConcepts.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {lesson.coreConcepts.map((concept) => (
                <GrammarConceptCard
                  key={concept.label}
                  label={concept.label}
                  coreImage={concept.coreImage}
                  metaphor={concept.metaphor}
                  keyWords={concept.keyWords}
                  colorScheme={concept.colorScheme ?? "indigo"}
                />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <GrammarConceptCard
                label={lesson.coreConceptA.label}
                coreImage={lesson.coreConceptA.coreImage}
                metaphor={lesson.coreConceptA.metaphor}
                keyWords={lesson.coreConceptA.keyWords}
                colorScheme="indigo"
              />
              <GrammarConceptCard
                label={lesson.coreConceptB.label}
                coreImage={lesson.coreConceptB.coreImage}
                metaphor={lesson.coreConceptB.metaphor}
                keyWords={lesson.coreConceptB.keyWords}
                colorScheme="violet"
              />
            </div>
          )}
        </section>

        <section className="mb-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            動詞ごとの使い分け
          </h2>
          {lesson.verbPairs.map((pair) => (
            <VerbPairCard key={pair.verb} pair={pair} />
          ))}
        </section>

        <section className="mb-10 space-y-10">
          {lesson.sections.map((sec) => (
            <div key={sec.id}>
              <h2 className="text-lg font-bold text-slate-800 mb-3">
                {sec.heading}
              </h2>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
                <GrammarSectionMarkdown source={sec.body} />
              </div>
              {sec.callout ? (
                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/90 px-4 py-3 text-sm text-indigo-950 leading-relaxed">
                  {sec.callout}
                </div>
              ) : null}
            </div>
          ))}
        </section>

        <section className="mb-10 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-5 sm:p-6 text-white shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200 mb-2">
            Pro Tip（C1 向け）
          </p>
          <p className="text-sm leading-relaxed text-white/95">{lesson.proTip}</p>
        </section>

        <GrammarPractice items={lesson.practiceItems} slug={lesson.slug} />

        <div className="mb-4 flex justify-end">
          <Link
            href="/library"
            className="text-[10px] font-mono font-semibold text-slate-500 hover:text-violet-600 underline underline-offset-2 transition-colors"
          >
            ライブラリで150表現を探す →
          </Link>
        </div>

        <div className="mb-10">
          <GrammarCta slug={lesson.slug} headline={ctaHeadline} />
        </div>

        {relatedLessons.length > 0 ? (
          <section className="mb-12">
            <h2 className="text-sm font-bold text-slate-700 mb-4">
              関連特集
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedLessons.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/library/grammar/${rel.slug}`}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 hover:border-indigo-200 hover:bg-white transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {rel.h1}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {rel.subtitle}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
