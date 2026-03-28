import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import { Breadcrumb } from "@/components/breadcrumb";
import { CefrBadge } from "@/components/cefr-badge";
import { GRAMMAR_LESSONS } from "@/lib/grammar-lesson";
import { getPublicSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const canonical = `${getPublicSiteUrl()}/library/grammar`;
  const title = "英語文法コアイメージ特集 | LinguistLens";
  const description =
    "前置詞・使役動詞・ingとto・時制など、日本人が感覚的に使いこなせていない英語文法をコアイメージで解説。CEFR B1〜C1対応。";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      images: [{ url: "/og", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og"],
    },
  };
}

export default function GrammarIndexPage() {
  return (
    <div className="min-h-screen relative">
      <SiteHeader maxWidth="5xl" right={<GlobalNav showVocabularyLink />} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: "Library", href: "/library" },
            { label: "文法コアイメージ特集" },
          ]}
        />

        <header className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight leading-tight">
            英語文法コアイメージ特集
          </h1>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            ルールの暗記ではなく「感覚の地図」として文法をつかむ短いレッスンです。検索やシェアで辿り着いた方は、気になるテーマからどうぞ。
          </p>
        </header>

        <ul className="space-y-4">
          {GRAMMAR_LESSONS.map((lesson) => (
            <li key={lesson.slug}>
              <Link
                href={`/library/grammar/${lesson.slug}`}
                className={cn(
                  "block rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm",
                  "hover:border-indigo-100 hover:shadow-md transition-all"
                )}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-900">
                    {lesson.category}
                  </span>
                  {lesson.targetLevels.map((lv) => (
                    <CefrBadge key={lv} level={lv} size="sm" />
                  ))}
                  <span className="text-xs text-slate-400 ml-auto font-mono">
                    約 {lesson.readingMinutes} 分
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {lesson.h1}
                </h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {lesson.subtitle}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
