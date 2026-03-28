"use client";

import Link from "next/link";
import { trackGrammarCtaClick } from "@/lib/analytics";

export interface GrammarCtaProps {
  slug: string;
  /** 特集ごとのメイン見出し（省略時は汎用コピー） */
  headline?: string;
}

const DEFAULT_HEADLINE =
  "実際のネイティブ音声で表現のニュアンスを耳で確かめよう";

export function GrammarCta({ slug, headline = DEFAULT_HEADLINE }: GrammarCtaProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 sm:p-8 text-center text-white shadow-md border border-indigo-500/20">
      <p className="text-2xl mb-2" aria-hidden>
        🎥
      </p>
      <h2 className="text-lg sm:text-xl font-extrabold mb-2 leading-snug">
        {headline}
      </h2>
      <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
        YouTube の URL を貼って LinguistLens
        で解析し、文脈の中の ing / to を拾い上げましょう。
      </p>
      <Link
        href="/"
        onClick={() => trackGrammarCtaClick({ slug })}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
      >
        今すぐ解析する →
      </Link>
    </section>
  );
}
