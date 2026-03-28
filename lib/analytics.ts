// Vercel Analytics カスタムイベントの型安全ラッパー
import { track } from "@vercel/analytics";

/** フレーズ保存イベントのペイロード */
export interface PhraseSavedPayload {
  expression: string;
  type: string; // phrasal_verb | idiom | collocation | grammar_pattern
  cefr_level: string; // A1〜C2
  source: "analysis" | "library" | "daily_phrase"; // 解析 / ライブラリ / 今日のフレーズ
}

/** アコーディオン開封イベントのペイロード */
export interface AccordionOpenedPayload {
  expression: string;
  cefr_level: string;
  source: "analysis" | "library";
}

/**
 * ユーザーがフレーズを保存したときに呼び出す。
 * Supabase / localStorage への保存が成功した後に呼ぶこと（重複やエラー時は呼ばない）。
 */
export function trackPhraseSaved(payload: PhraseSavedPayload): void {
  track("phrase_saved", {
    expression: payload.expression,
    type: payload.type,
    cefr_level: payload.cefr_level,
    source: payload.source,
  });
}

/**
 * ユーザーが詳細アコーディオンを「開いた」ときに呼び出す。
 * 閉じるときは呼ばない（開封のみを計測）。
 */
export function trackAccordionOpened(payload: AccordionOpenedPayload): void {
  track("accordion_opened", {
    expression: payload.expression,
    cefr_level: payload.cefr_level,
    source: payload.source,
  });
}

/** 文法特集ページの CTA クリック */
export interface GrammarCtaClickPayload {
  slug: string;
}

export function trackGrammarCtaClick(payload: GrammarCtaClickPayload): void {
  track("grammar_cta_click", { slug: payload.slug });
}

/** 文法特集のミニクイズ完了（全問正解時） */
export interface GrammarPracticeCompletedPayload {
  slug: string;
  score: number;
  total: number;
}

export function trackGrammarPracticeCompleted(
  payload: GrammarPracticeCompletedPayload
): void {
  track("grammar_practice_completed", {
    slug: payload.slug,
    score: payload.score,
    total: payload.total,
  });
}
