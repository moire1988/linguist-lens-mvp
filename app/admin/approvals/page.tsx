"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ChevronLeft, Globe, Trash2, Loader2, RefreshCw } from "lucide-react";
import { SiteHeader, HeaderLogo } from "@/components/site-header";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getAdminPendingAnalyses,
  publishAnalysisAction,
  deleteAnalysisAction,
  type PendingAnalysis,
} from "@/app/actions/admin-analyses";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600 border-slate-200",
  A2: "bg-green-100 text-green-700 border-green-200",
  B1: "bg-blue-100 text-blue-700 border-blue-200",
  B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  C1: "bg-purple-100 text-purple-700 border-purple-200",
  C2: "bg-rose-100 text-rose-700 border-rose-200",
};

const TYPE_LABELS: Record<string, string> = {
  phrasal_verb: "句動詞",
  idiom: "イディオム",
  collocation: "コロケーション",
  grammar_pattern: "文法",
};

export default function ApprovalsPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  const isAdmin = isLoaded && userId === adminId;

  const [items, setItems] = useState<PendingAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.replace("/");
    }
  }, [isLoaded, isAdmin, router]);

  const loadItems = async () => {
    setIsLoading(true);
    const data = await getAdminPendingAnalyses();
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handlePublish = async (id: string) => {
    setLoadingId(id);
    const result = await publishAnalysisAction(id);
    setLoadingId(null);

    if (!result.ok) {
      toast.error(result.error ?? "公開に失敗しました");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("公開しました");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この解析を削除しますか？")) return;
    setLoadingId(id);
    const result = await deleteAnalysisAction(id);
    setLoadingId(null);

    if (!result.ok) {
      toast.error(result.error ?? "削除に失敗しました");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("削除しました");
  };

  if (!isLoaded || !isAdmin) return null;

  return (
    <div className="min-h-screen relative">
      <SiteHeader
        maxWidth="3xl"
        left={
          <div className="flex items-center gap-2.5">
            <HeaderLogo />
            <span className="text-slate-300 select-none">|</span>
            <span className="text-xs font-semibold text-slate-500 tracking-wide">
              解析 承認キュー
            </span>
          </div>
        }
        right={
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            管理パネルへ
          </button>
        }
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-slate-800">
            承認待ち
            {!isLoading && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                {items.length}件
              </span>
            )}
          </h1>
          <button
            onClick={loadItems}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            再読込
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse"
              >
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            承認待ちの解析はありません
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isThisLoading = loadingId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5"
                >
                  {/* Meta */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                            LEVEL_COLORS[item.level] ?? "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {item.level}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {new Date(item.createdAt).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {item.title && (
                        <p className="text-sm font-medium text-slate-800 font-mono truncate leading-snug">
                          {item.title}
                        </p>
                      )}
                      {item.url && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.url}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        ユーザー: {item.userId.slice(0, 6)}...{item.userId.slice(-4)}
                      </p>
                    </div>
                  </div>

                  {/* Phrase preview */}
                  {item.phrases.length > 0 && (
                    <div className="mb-3 border-t border-slate-100 pt-2.5 space-y-1">
                      {item.phrases.map((phrase, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-700 font-medium">
                            {phrase.expression}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({TYPE_LABELS[phrase.type] ?? phrase.type})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                    <button
                      onClick={() => handlePublish(item.id)}
                      disabled={isThisLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      {isThisLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Globe className="w-3.5 h-3.5" />
                      )}
                      公開する
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isThisLoading}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 border border-rose-100 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    >
                      {isThisLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
