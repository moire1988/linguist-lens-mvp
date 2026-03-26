/**
 * トップページ解析の UI デバッグ用「魔法の入力」。
 * 有効化はサーバー側で NODE_ENV === "development" のときのみ。
 */
export const ANALYZE_DEBUG_MAGIC_INPUT_RAW = "debug";

/** ユーザー指定どおり（www なし）の完全一致のみ */
export const ANALYZE_DEBUG_MAGIC_YOUTUBE_URL =
  "https://youtube.com/watch?v=debug";

export function isAnalyzeDebugMagicUrlInput(input: string): boolean {
  const t = input.trim();
  return (
    t === ANALYZE_DEBUG_MAGIC_INPUT_RAW ||
    t === ANALYZE_DEBUG_MAGIC_YOUTUBE_URL
  );
}
