"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toggleListingRequestAction } from "@/app/actions/save-analysis";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  analysisId: string;
  initialPublicReviewRequested: boolean;
  initialIsApproved: boolean;
  /** 親の「リンク共有」がオンか（オフ時は掲載トグルを無効化） */
  linkShared: boolean;
}

/**
 * トップ「みんなの解析」掲載の申請トグル。YouTube 解析の詳細ページでのみ使用する。
 */
export function AnalysisYoutubeListingPanel({
  analysisId,
  initialPublicReviewRequested,
  initialIsApproved,
  linkShared,
}: Props) {
  const [reviewRequested, setReviewRequested] = useState(
    initialPublicReviewRequested
  );
  const [feedApproved, setFeedApproved] = useState(initialIsApproved);
  const [isPendingListing, startListingTransition] = useTransition();

  useEffect(() => {
    setReviewRequested(initialPublicReviewRequested);
    setFeedApproved(initialIsApproved);
  }, [initialPublicReviewRequested, initialIsApproved]);

  /** リンク共有オフ時は DB 側も掲載フラグが落ちるため、ローカル表示を揃える */
  useEffect(() => {
    if (!linkShared) {
      setReviewRequested(false);
      setFeedApproved(false);
    }
  }, [linkShared]);

  const pendingListing = reviewRequested && !feedApproved;
  const listingToggleOn = reviewRequested || feedApproved;

  const handleListingToggle = () => {
    if (!linkShared) {
      toast.error("先にリンク共有をオンにしてください");
      return;
    }
    const next = !(reviewRequested || feedApproved);
    const snapshot = { req: reviewRequested, appr: feedApproved };

    if (next) {
      setReviewRequested(true);
    } else {
      setReviewRequested(false);
      setFeedApproved(false);
    }

    startListingTransition(async () => {
      const result = await toggleListingRequestAction(analysisId, next);
      if (!result.ok) {
        setReviewRequested(snapshot.req);
        setFeedApproved(snapshot.appr);
        toast.error("更新に失敗しました", { description: result.error });
        return;
      }
      if (next) {
        toast.success("みんなの解析への掲載を申請しました");
      } else if (snapshot.appr) {
        toast.success("トップページの掲載を取り下げました");
      } else {
        toast.success("掲載申請を取り下げました");
      }
    });
  };

  const feedHeadline = feedApproved
    ? "みんなの解析に掲載中"
    : pendingListing
      ? "掲載審査待ち"
      : "トップに載せない";

  const feedDescription = feedApproved
    ? "トップページの「みんなの解析」に表示されています（YouTube解析・管理者承認済み）。"
    : pendingListing
      ? "管理者が承認すると、トップの一覧に表示されます。"
      : "トップの一覧に載せるには、申請して管理者の承認が必要です。";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 mb-8 transition-colors duration-300",
        feedApproved
          ? "border-emerald-200 bg-emerald-50/40 shadow-sm"
          : pendingListing
            ? "border-amber-200 bg-amber-50/40 shadow-sm"
            : "border-slate-200 bg-white"
      )}
    >
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
        みんなの解析（トップ掲載）
      </p>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-base font-bold text-slate-900 leading-tight">
            {feedApproved ? "🌍 " : pendingListing ? "⏳ " : "📋 "}
            {feedHeadline}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {feedDescription}
          </p>
        </div>

        <button
          type="button"
          onClick={handleListingToggle}
          disabled={isPendingListing || !linkShared}
          aria-pressed={listingToggleOn}
          className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 self-start sm:mt-1"
          style={{
            background: !linkShared
              ? "#e2e8f0"
              : listingToggleOn
                ? feedApproved
                  ? "#10b981"
                  : "#f59e0b"
                : "#e2e8f0",
          }}
        >
          {isPendingListing ? (
            <Loader2
              className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin"
              style={{
                color: listingToggleOn && linkShared ? "#fff" : "#94a3b8",
              }}
            />
          ) : (
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{
                transform: listingToggleOn
                  ? "translateX(20px)"
                  : "translateX(0)",
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
