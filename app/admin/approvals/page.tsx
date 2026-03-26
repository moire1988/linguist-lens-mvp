"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { isAppAdminUser } from "@/lib/is-app-admin";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Globe,
  Trash2,
  Loader2,
  RefreshCw,
  Film,
  ExternalLink,
} from "lucide-react";
import { extractYouTubeVideoId } from "@/lib/youtube-url";
import { SiteHeader, HeaderLogo } from "@/components/site-header";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getAdminPendingAnalyses,
  getAdminPublishedAnalyses,
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

type AdminQueueTab = "pending" | "published";

type AnalysisQueueCardProps =
  | {
      item: PendingAnalysis;
      mode: "pending";
      isBusy: boolean;
      onPublish: () => void;
      onDelete: () => void;
    }
  | {
      item: PendingAnalysis;
      mode: "published";
      isBusy: boolean;
      onDelete: () => void;
    };

function AnalysisQueueCard(props: AnalysisQueueCardProps) {
  const { item, mode, isBusy, onDelete } = props;
  const onPublish = props.mode === "pending" ? props.onPublish : undefined;
  const ytId =
    item.url != null && item.url.trim().length > 0
      ? extractYouTubeVideoId(item.url)
      : null;
  const thumbSrc = ytId
    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    : null;
  const displayTitle =
    item.title?.trim() ||
    (ytId ? "YouTube動画" : null) ||
    (item.url?.trim() ? "（タイトルなし）" : "（ソースなし）");

  const userLine =
    item.userId.length > 0
      ? `ユーザー: ${item.userId.slice(0, 6)}...${item.userId.slice(-4)}`
      : "ユーザー: ゲスト";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-4 mb-3">
        <div
          className={cn(
            "relative w-full sm:w-44 md:w-48 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100",
            "aspect-video"
          )}
        >
          {thumbSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <Film className="h-10 w-10" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                LEVEL_COLORS[item.level] ??
                  "bg-slate-100 text-slate-600 border-slate-200"
              )}
            >
              {item.level}
            </span>
            <span className="text-[10px] text-slate-400 sm:ml-auto">
              {new Date(item.createdAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
            {displayTitle}
          </p>
          {item.url && (
            <p className="text-[11px] text-slate-400 truncate mt-1">{item.url}</p>
          )}
          <p className="text-[10px] text-slate-400 mt-1">{userLine}</p>
        </div>
      </div>

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

      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
        {mode === "pending" && onPublish ? (
          <>
            <button
              type="button"
              onClick={onPublish}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {isBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              掲載を承認
            </button>
            <a
              href={`/analyses/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="ユーザーがリンク共有をオンにしていれば、未掲載でも URL を知る人は閲覧できます"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              解析ページ
            </a>
          </>
        ) : (
          <a
            href={`/analyses/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            解析ページ
          </a>
        )}

        <button
          type="button"
          onClick={onDelete}
          disabled={isBusy}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 border border-rose-100 hover:bg-rose-50 transition-colors disabled:opacity-50",
            mode === "pending" ? "ml-auto" : "ml-auto sm:ml-0"
          )}
        >
          {isBusy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          削除
        </button>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 animate-pulse"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="aspect-video w-full sm:w-44 md:w-48 shrink-0 rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ApprovalsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const isAdmin =
    isLoaded &&
    isAppAdminUser(
      user?.id,
      user?.publicMetadata as Record<string, unknown> | undefined
    );

  const [tab, setTab] = useState<AdminQueueTab>("pending");
  const [pendingItems, setPendingItems] = useState<PendingAnalysis[]>([]);
  const [publishedItems, setPublishedItems] = useState<PendingAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.replace("/");
    }
  }, [isLoaded, isAdmin, router]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const [p, pub] = await Promise.all([
      getAdminPendingAnalyses(),
      getAdminPublishedAnalyses(),
    ]);
    setPendingItems(p);
    setPublishedItems(pub);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadItems();
  }, [isAdmin, loadItems]);

  const handlePublish = async (id: string) => {
    setLoadingId(id);
    const result = await publishAnalysisAction(id);
    setLoadingId(null);

    if (!result.ok) {
      toast.error(result.error ?? "掲載の承認に失敗しました");
      return;
    }

    await loadItems();
    toast.success("トップの「みんなの解析」に掲載しました");
    setTab("published");
  };

  const handleDeletePending = async (id: string) => {
    if (!confirm("この解析を削除しますか？")) return;
    setLoadingId(id);
    const result = await deleteAnalysisAction(id);
    setLoadingId(null);

    if (!result.ok) {
      toast.error(result.error ?? "削除に失敗しました");
      return;
    }

    setPendingItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("削除しました");
  };

  const handleDeletePublished = async (id: string) => {
    if (
      !confirm(
        "この解析を削除します。リンク共有・トップ掲載の両方が無効になります。続行しますか？"
      )
    ) {
      return;
    }
    setLoadingId(id);
    const result = await deleteAnalysisAction(id);
    setLoadingId(null);

    if (!result.ok) {
      toast.error(result.error ?? "削除に失敗しました");
      return;
    }

    setPublishedItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("削除しました");
  };

  if (!isLoaded || !isAdmin) return null;

  const activeList = tab === "pending" ? pendingItems : publishedItems;
  const emptyMessage =
    tab === "pending"
      ? "承認待ちの解析はありません"
      : "公開済みの解析はまだありません";

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-0 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setTab("pending")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === "pending"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              承認待ち
              {!isLoading && (
                <span className="ml-1.5 tabular-nums text-slate-400 font-normal">
                  {pendingItems.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab("published")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === "published"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              公開済み
              {!isLoading && (
                <span className="ml-1.5 tabular-nums text-slate-400 font-normal">
                  {publishedItems.length}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={loadItems}
            disabled={isLoading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            再読込
          </button>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : activeList.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {tab === "pending"
              ? activeList.map((item) => (
                  <AnalysisQueueCard
                    key={item.id}
                    item={item}
                    mode="pending"
                    isBusy={loadingId === item.id}
                    onPublish={() => handlePublish(item.id)}
                    onDelete={() => handleDeletePending(item.id)}
                  />
                ))
              : activeList.map((item) => (
                  <AnalysisQueueCard
                    key={item.id}
                    item={item}
                    mode="published"
                    isBusy={loadingId === item.id}
                    onDelete={() => handleDeletePublished(item.id)}
                  />
                ))}
          </div>
        )}

        {!isLoading && tab === "published" && publishedItems.length >= 200 && (
          <p className="text-center text-[11px] text-slate-400">
            直近 200 件まで表示しています。古いデータは再読込で確認してください。
          </p>
        )}
      </main>
    </div>
  );
}
