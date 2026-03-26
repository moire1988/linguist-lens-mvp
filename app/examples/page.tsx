import Link from "next/link";
import type { Metadata } from "next";
import { Film } from "lucide-react";
import { EXAMPLES } from "@/lib/examples-data";
import { getExampleVideoCardMeta } from "@/lib/example-video-card-meta";
import { extractYouTubeVideoId } from "@/lib/youtube-url";
import {
  RECOMMENDED_CATEGORY_STYLES,
  RECOMMENDED_LEVEL_STYLES,
} from "@/lib/recommended-video-badges";
import { cn } from "@/lib/utils";
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
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-500">
            Sample Videos
          </p>
          <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            サンプル動画一覧
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            公開サンプルからフレーズ抽出の見本を閲覧できます。各カードから詳細ページへ進みます。
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {EXAMPLES.map((ex) => {
            const videoId = extractYouTubeVideoId(ex.url);
            const thumbSrc = videoId
              ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
              : null;
            const meta = getExampleVideoCardMeta(ex);

            return (
              <li key={ex.slug}>
                <Link
                  href={`/examples/${ex.slug}`}
                  className={cn(
                    "flex h-full flex-col overflow-hidden rounded-xl",
                    "border border-slate-200 bg-white shadow-sm",
                    "hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5",
                    "transition-all duration-200 group"
                  )}
                >
                  <div className="relative h-[144px] shrink-0 overflow-hidden bg-slate-100">
                    {thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- YouTube サムネ（外部ドメイン）
                      <img
                        src={thumbSrc}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Film className="h-10 w-10" aria-hidden />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    <span
                      className={cn(
                        "absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border bg-white/90 backdrop-blur-sm",
                        RECOMMENDED_LEVEL_STYLES[meta.level] ??
                          RECOMMENDED_LEVEL_STYLES["B1"]
                      )}
                    >
                      {meta.level}
                    </span>

                    <span
                      className={cn(
                        "absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border bg-white/90 backdrop-blur-sm",
                        RECOMMENDED_CATEGORY_STYLES[meta.category]
                      )}
                    >
                      {meta.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <p className="font-mono text-xs font-semibold leading-snug text-slate-700 line-clamp-2 transition-colors group-hover:text-indigo-600">
                      {ex.title}
                    </p>
                    {ex.sublabel && (
                      <p className="mt-1 truncate font-mono text-[10px] text-slate-400">
                        {ex.sublabel}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="font-mono text-[10px] text-slate-400">
                        {meta.cefrRange}
                      </span>
                      <span className="font-mono text-[10px] text-indigo-400 transition-colors group-hover:text-indigo-600">
                        解析結果を見る →
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
