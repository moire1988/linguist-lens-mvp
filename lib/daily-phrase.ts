import type { LibraryEntry } from "@/lib/library";
import libraryData from "@/data/library.json";

const LIBRARY = libraryData as LibraryEntry[];

/**
 * 今日の日付（UTC）を seed にして、毎日違うフレーズを返す。
 * 全ユーザーが同じ日に同じフレーズを見る（SNS共有も可能）。
 */
export function getTodaysPhrase(): LibraryEntry {
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const index = daysSinceEpoch % LIBRARY.length;
  return LIBRARY[index]!;
}
