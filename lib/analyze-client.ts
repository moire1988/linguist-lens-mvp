import type { AnalysisResult, AnalyzeErrorCode } from "@/lib/types";

export type AnalyzeContentResult =
  | { success: true; data: AnalysisResult }
  | { success: false; error: string; errorCode: AnalyzeErrorCode };

/**
 * 解析を HTTP 経由で実行する（Server Action のクライアント用スタブと分離し Webpack 不整合を避ける）。
 */
export async function callAnalyzeApi(
  input: string,
  cefrLevel: string,
  inputMode: "url" | "text",
  devMode?: boolean
): Promise<AnalyzeContentResult> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, cefrLevel, inputMode, devMode }),
      credentials: "same-origin",
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return {
        success: false,
        error: "解析レスポンスの読み取りに失敗しました",
        errorCode: "generic",
      };
    }

    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      typeof (data as { success: unknown }).success === "boolean"
    ) {
      return data as AnalyzeContentResult;
    }

    return {
      success: false,
      error: "解析リクエストに失敗しました",
      errorCode: "generic",
    };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "ネットワークエラーが発生しました";
    return {
      success: false,
      error: msg,
      errorCode: "generic",
    };
  }
}
