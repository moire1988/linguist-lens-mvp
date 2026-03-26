"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AnalysisSharePanel } from "@/components/analysis-share-panel";
import { AnalysisYoutubeListingPanel } from "@/components/analysis-youtube-listing-panel";

interface Props {
  analysisId: string;
  isOwner: boolean;
  initialIsPublic: boolean;
  initialPublicReviewRequested: boolean;
  initialIsApproved: boolean;
  /** YouTube のときのみ掲載パネルを出す */
  showYoutubeListingPanel: boolean;
  shareUrl: string;
  phraseCount: number;
  cefrLevel: string;
}

export function AnalysisDetailFooter({
  analysisId,
  isOwner,
  initialIsPublic,
  initialPublicReviewRequested,
  initialIsApproved,
  showYoutubeListingPanel,
  shareUrl,
  phraseCount,
  cefrLevel,
}: Props) {
  const [linkShared, setLinkShared] = useState(initialIsPublic);

  useEffect(() => {
    setLinkShared(initialIsPublic);
  }, [initialIsPublic]);

  const handleLinkSharedChange = useCallback((shared: boolean) => {
    setLinkShared(shared);
  }, []);

  if (isOwner) {
    return (
      <>
        <AnalysisSharePanel
          analysisId={analysisId}
          initialIsPublic={initialIsPublic}
          isOwner
          shareUrl={shareUrl}
          phraseCount={phraseCount}
          cefrLevel={cefrLevel}
          onLinkSharedChange={
            showYoutubeListingPanel ? handleLinkSharedChange : undefined
          }
        />

        {showYoutubeListingPanel && (
          <AnalysisYoutubeListingPanel
            analysisId={analysisId}
            initialPublicReviewRequested={initialPublicReviewRequested}
            initialIsApproved={initialIsApproved}
            linkShared={linkShared}
          />
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10 mb-16">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            別の動画を解析する
          </Link>
          <Link
            href="/mypage"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            マイページを見る
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="mt-4 mb-16">
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 sm:p-10 text-center text-white shadow-lg shadow-indigo-900/20">
        <div className="inline-flex items-center justify-center gap-2 mb-5">
          <Sparkles className="h-6 w-6 text-amber-200" aria-hidden />
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
            自分もLinguistLensで動画を解析してみる✨
          </h2>
        </div>
        <p className="text-sm text-indigo-100/95 max-w-lg mx-auto mb-6 leading-relaxed">
          YouTube URL を貼るだけで、あなたのレベルに合ったフレーズを AI が抽出します。
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-md"
        >
          トップページへ
          <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
