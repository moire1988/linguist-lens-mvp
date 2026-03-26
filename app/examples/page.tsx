import Link from "next/link";
import type { Metadata } from "next";
import { EXAMPLES } from "@/lib/examples-data";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";

export const metadata: Metadata = {
  title: "サンプル動画一覧",
  description:
    "実際のスピーチ・動画から、句動詞・イディオム・コロケーションをCEFRレベル別に学べるサンプル一覧です。",
};

export default function ExamplesIndexPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader maxWidth="5xl" right={<GlobalNav />} />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          サンプル動画一覧
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          公開サンプルからフレーズ抽出の見本を閲覧できます。各カードから詳細ページへ進みます。
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {EXAMPLES.map((ex) => (
            <li key={ex.slug}>
              <Link
                href={`/examples/${ex.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/80 px-4 py-3 shadow-sm transition-colors hover:border-violet-200/80 hover:bg-violet-50/30"
              >
                <span className="text-2xl" aria-hidden>
                  {ex.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900">
                    {ex.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {ex.sublabel}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
