"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { isAppAdminUser } from "@/lib/is-app-admin";
import { useRouter } from "next/navigation";
import { Wand2, RefreshCw, Globe, EyeOff, Trash2, ExternalLink, ChevronLeft, Loader2 } from "lucide-react";
import type { EnglishVariant } from "@/lib/article-types";
import { cn } from "@/lib/utils";
import { SiteHeader, HeaderLogo } from "@/components/site-header";
import { toast } from "sonner";
import { generateCmsArticle } from "@/app/actions/generate-cms-article";
import { getAdminArticles, updateArticlePublish, deleteAdminArticle } from "@/app/actions/admin-articles";
import type { Article } from "@/lib/article-types";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_CATEGORY_SHORT_LABEL,
  getArticleCategoryDisplayLabel,
} from "@/lib/article-categories";
import { VariantBadge } from "@/components/variant-badge";

// ─── CEFR / Variant helpers ───────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const VARIANTS: { value: EnglishVariant; label: string }[] = [
  { value: "US",     label: "🇺🇸 US"  },
  { value: "UK",     label: "🇬🇧 UK"  },
  { value: "AU",     label: "🇦🇺 AU"  },
  { value: "common", label: "🌐 共通" },
];
function AdminFilterRow({ label, options, active, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pt-1.5 w-12 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
              active === opt.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** `generate-cms-article.ts` の VARIANT_WEIGHTS と一致（目標比率の説明用） */
const VARIANT_RATIO_HELP =
  "🇺🇸 US 30% · 🇬🇧 UK 10% · 🇦🇺 AU 10% · 🌐 共通 50%";

const CATEGORY_GENERATION_HELP = (ARTICLE_CATEGORIES as readonly string[])
  .map((c) => ARTICLE_CATEGORY_SHORT_LABEL[c] ?? c)
  .join(" / ");

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
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const isAdmin =
    isLoaded &&
    isAppAdminUser(
      user?.id,
      user?.publicMetadata as Record<string, unknown> | undefined
    );

  // Redirect non-admins
  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.replace("/");
    }
  }, [isLoaded, isAdmin, router]);

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("B1");
  const [filterLevel,    setFilterLevel]    = useState("all");
  const [filterVariant,  setFilterVariant]  = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
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

    setGeneratedResult({ title: result.article.titleEn, slug: result.article.slug });
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
    if (!confirm(`「${article.titleEn}」を削除しますか？`)) return;
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/approvals")}
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
            >
              承認キュー
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              トップへ
            </button>
          </div>
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

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-[11px] leading-relaxed text-slate-600 space-y-2">
            <p>
              <span className="font-semibold text-slate-700">英語バリアントの目標割合</span>
              <span className="text-slate-400 mx-1">—</span>
              {VARIANT_RATIO_HELP}
              <span className="block mt-1 text-slate-500">
                直近20件の生成履歴を見て不足分を優先します。履歴が少ないときは上記の重み付きランダムに近い出方になります。
              </span>
            </p>
            <p className="border-t border-slate-200/80 pt-2">
              <span className="font-semibold text-slate-700">生成カテゴリ</span>
              <span className="text-slate-400 mx-1">—</span>
              次のいずれか1つが選ばれます（
              <span className="font-medium text-slate-700">{CATEGORY_GENERATION_HELP}</span>
              ）。各カテゴリが偏りすぎないよう直近20件を参照してバランスします。
            </p>
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

          {/* Filters */}
          {!isLoadingArticles && articles.length > 0 && (() => {
            const existingCategories = Array.from(
              new Set(articles.map((a) => a.category).filter((c): c is string => Boolean(c)))
            ).sort((a, b) =>
              getArticleCategoryDisplayLabel(a).localeCompare(
                getArticleCategoryDisplayLabel(b),
                "ja"
              )
            );
            const levelOpts    = [{ value: "all", label: "すべて" }, ...LEVELS.filter((l) => articles.some((a) => a.level === l)).map((l) => ({ value: l, label: l }))];
            const variantOpts  = [{ value: "all", label: "すべて" }, ...VARIANTS.filter((v) => articles.some((a) => a.englishVariant === v.value)).map((v) => ({ value: v.value, label: v.label }))];
            const categoryOpts = [
              { value: "all", label: "すべて" },
              ...existingCategories.map((c) => ({
                value: c,
                label: getArticleCategoryDisplayLabel(c),
              })),
            ];
            const hasFilter = filterLevel !== "all" || filterVariant !== "all" || filterCategory !== "all";
            return (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 space-y-2.5">
                <AdminFilterRow label="レベル"   options={levelOpts}    active={filterLevel}    onChange={setFilterLevel}    />
                <AdminFilterRow label="言語"     options={variantOpts}  active={filterVariant}  onChange={setFilterVariant}  />
                {existingCategories.length > 0 && (
                  <AdminFilterRow label="カテゴリ" options={categoryOpts} active={filterCategory} onChange={setFilterCategory} />
                )}
                {hasFilter && (
                  <div className="pt-0.5 flex justify-end">
                    <button
                      onClick={() => { setFilterLevel("all"); setFilterVariant("all"); setFilterCategory("all"); }}
                      className="text-[10px] font-mono text-indigo-400 hover:text-indigo-600 transition-colors underline underline-offset-2"
                    >
                      リセット
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

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
              {articles.filter((a) => {
                if (filterLevel    !== "all" && a.level             !== filterLevel)    return false;
                if (filterVariant  !== "all" && a.englishVariant    !== filterVariant)  return false;
                if (filterCategory !== "all" && (a.category ?? "") !== filterCategory) return false;
                return true;
              }).map((article) => {
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
                        <p className="text-sm font-medium text-slate-800 leading-snug truncate font-mono">
                          {article.titleEn}
                        </p>
                        {article.titleJa && (
                          <p className="text-xs text-slate-500 leading-snug truncate mt-0.5">
                            {article.titleJa}
                          </p>
                        )}
                        {(article.category || article.keyword) && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {article.category && (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 truncate max-w-[140px]">
                                {getArticleCategoryDisplayLabel(article.category)}
                              </span>
                            )}
                            {article.keyword && (
                              <span className="text-[9px] font-mono text-slate-400 truncate max-w-[180px]">
                                🔑 {article.keyword}
                              </span>
                            )}
                          </div>
                        )}
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

    </div>
  );
}
