import type { ExpressionType } from "@/lib/types";

export type LibraryLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/** `data/library.json` およびライブラリUI・X投稿スクリプトで共有 */
export interface LibraryEntry {
  id: string;
  expression: string;
  type: ExpressionType;
  level: LibraryLevel;
  meaning_ja: string;
  coreImage: string;
  nuance: string;
  badExample?: string;
  warnExample?: string;
  warnNote?: string;
  goodExample: string;
  goodExampleJa: string;
  context: string;
  why_hard_for_japanese: string;
}
