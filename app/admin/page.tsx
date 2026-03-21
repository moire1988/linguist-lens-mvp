"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Wand2, RefreshCw, Globe, EyeOff, Trash2, ExternalLink, ChevronLeft, Loader2 } from "lucide-react";
import { SiteHeader, HeaderLogo } from "@/components/site-header";
import { toast } from "sonner";
import { generateCmsArticle } from "@/app/actions/generate-cms-article";
import { getAdminArticles, updateArticlePublish, deleteAdminArticle } from "@/app/actions/admin-articles";
import type { Article } from "@/lib/article-types";
import { VariantBadge } from "@/components/variant-badge";
import { SiteFooter } from "@/components/site-footer";

// ─── CEFR helpers ─────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600 border-slate-200",
  A2: "bg-green-100 text-green-700 border-green-200",
  B1: "bg-blue-100 text-blue-700 border-blue-200",
  B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  C1: "bg-purple-100 text-purple-700 border-purple-200",
  C2: "bg-rose-100 text-rose-700 border-rose-200",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  const isAdmin = isLoaded && userId === adminId;

  // Redirect non-admins
  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.replace("/");
    }
  }, [isLoaded, isAdmin, router]);

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("B1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ title: string; slug: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ── Load articles ──────────────────────────────────────────────────────────

  const loadArticles = useCallback(async () => {
    setIsLoadingArticles(true);
    const data = await getAdminArticles();
    setArticles(data);
    setIsLoadingArticles(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadArticles();
  }, [isAdmin, loadArticles]);

  // ── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedResult(null);
    const result = await generateCmsArticle(selectedLevel);
    setIsGenerating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setGeneratedResult({ title: result.article.title, slug: result.article.slug });
    setArticles((prev) => [result.article, ...prev]);
    toast.success("記事を生成しました");
  };

  // ── Publish toggle ─────────────────────────────────────────────────────────

  const handleTogglePublish = async (article: Article) => {
    setLoadingId(article.id);
    const publish = !article.publishedAt;
    const result = await updateArticlePublish(article.id, publish);
    setLoadingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setArticles((prev) =>
      prev.map((a) =>
        a.id === article.id
          ? { ...a, publishedAt: publish ? new Date().toISOString() : null }
          : a
      )
    );
    toast.success(publish ? "公開しました" : "非公開にしました");
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (article: Article) => {
    if (!confirm(`「${article.title}」を削除しますか？`)) return;
    setLoadingId(article.id);
    const result = await deleteAdminArticle(article.id);
    setLoadingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setArticles((prev) => prev.filter((a) => a.id !== article.id));
    toast.success("削除しました");
  };

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!isLoaded || !isAdmin) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen relative">
      <SiteHeader
        maxWidth="5xl"
        left={
          <div className="flex items-center gap-2.5">
            <HeaderLogo />
            <span className="text-slate-300 select-none">|</span>
            <span className="text-xs font-semibold text-slate-500 tracking-wide">CMS 管理パネル</span>
          </div>
        }
        right={
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            トップへ
          </button>
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Generator Card */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">記事を生成</h2>

          {/* Level selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedLevel === level
                    ? LEVEL_COLORS[level] + " ring-2 ring-offset-1 ring-current"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {selectedLevel}の記事を執筆中...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                {selectedLevel}の記事を生成
              </>
            )}
          </button>

          {/* Success message */}
          {generatedResult && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200">
              <span className="font-medium truncate">✓ {generatedResult.title}</span>
              <a
                href={`/articles/${generatedResult.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto shrink-0 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
              >
                /articles/{generatedResult.slug}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </section>

        {/* Articles List */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">
              記事一覧
              {!isLoadingArticles && (
                <span className="ml-2 text-sm font-normal text-slate-400">{articles.length}件</span>
              )}
            </h2>
            <button
              onClick={loadArticles}
              disabled={isLoadingArticles}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingArticles ? "animate-spin" : ""}`} />
              再読込
            </button>
          </div>

          {isLoadingArticles ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              記事がありません。上のフォームから生成してください。
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => {
                const isPublished = !!article.publishedAt;
                const isThisLoading = loadingId === article.id;

                return (
                  <div
                    key={article.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${LEVEL_COLORS[article.level]}`}
                          >
                            {article.level}
                          </span>
                          <VariantBadge variant={article.englishVariant} size="sm" />
                          <span
                            className={`flex items-center gap-1 text-xs font-medium ${
                              isPublished ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPublished ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            />
                            {isPublished ? "公開中" : "下書き"}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(article.createdAt).toLocaleDateString("ja-JP", {
                              month: "numeric",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 leading-snug truncate">
                          {article.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          /articles/{article.slug}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleTogglePublish(article)}
                        disabled={isThisLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                          isPublished
                            ? "text-slate-600 border-slate-200 hover:bg-slate-50"
                            : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        {isThisLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isPublished ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                        {isPublished ? "非公開にする" : "公開する"}
                      </button>

                      <a
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        記事を見る
                      </a>

                      <button
                        onClick={() => handleDelete(article)}
                        disabled={isThisLoading}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 border border-rose-100 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        削除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
