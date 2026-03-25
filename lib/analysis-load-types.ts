import type { SavedAnalysis } from "@/lib/saved-analyses";

/** 解析詳細ページ用（DB 由来・isPublic / isOwner 付き） */
export type AnalysisDetail = SavedAnalysis & {
  isPublic: boolean;
  isOwner: boolean;
};

/** 解析詳細の読み込み失敗理由（開発時デバッグ用） */
export type AnalysisLoadFailure =
  | { reason: "empty_id" }
  | { reason: "admin_client_error"; message: string }
  | { reason: "db_error"; message: string; code?: string }
  | { reason: "no_row" }
  | {
      reason: "access_denied";
      isPublic: boolean;
      rowUserId: string | null;
      viewerUserId: string | null;
      redirectToSignInAvailable: boolean;
    };

export type AnalysisDetailResult =
  | { ok: true; analysis: AnalysisDetail }
  | { ok: false; failure: AnalysisLoadFailure };
