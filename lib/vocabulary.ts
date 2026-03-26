import type { ExpressionType } from "@/lib/types";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SavedPhrase {
  id: string;
  expression: string;
  type: ExpressionType;
  cefr_level: string;
  meaning_ja: string;
  nuance: string;
  example: string;
  example_translation?: string;
  context: string;
  why_hard_for_japanese: string;
  sourceUrl?: string;
  /** 解析結果ページなどで保存した場合の saved_analyses.id */
  source_analysis_id?: string;
  savedAt: string;
  status?: 'learning' | 'archived';
  archivedAt?: string;
}

export type SaveResult =
  | { success: true; phrase: SavedPhrase }
  | { success: false; reason: "duplicate" | "limit_reached" };

// ─── Constants ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "linguist-lens-vocabulary";
const DAILY_KEY = "linguist-lens-daily";
export const FREE_DAILY_LIMIT = 5;

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ─── Daily limit ───────────────────────────────────────────────────────────

interface DailyRecord {
  date: string;
  count: number;
}

function getDailyRecord(): DailyRecord {
  if (typeof window === "undefined") return { date: todayStr(), count: 0 };
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return { date: todayStr(), count: 0 };
    const rec = JSON.parse(raw) as DailyRecord;
    // 日付が変わったらリセット
    return rec.date === todayStr() ? rec : { date: todayStr(), count: 0 };
  } catch {
    return { date: todayStr(), count: 0 };
  }
}

export function getDailyCount(): number {
  return getDailyRecord().count;
}

export function getDailyRemaining(): number {
  return Math.max(0, FREE_DAILY_LIMIT - getDailyRecord().count);
}

function incrementDailyCount(): void {
  const rec = getDailyRecord();
  localStorage.setItem(
    DAILY_KEY,
    JSON.stringify({ date: todayStr(), count: rec.count + 1 })
  );
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export function getVocabulary(): SavedPhrase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPhrase[]) : [];
  } catch {
    return [];
  }
}

export function savePhrase(
  phrase: Omit<SavedPhrase, "id" | "savedAt">
): SaveResult {
  const current = getVocabulary();

  // 重複チェック（大文字小文字を無視）
  const existing = current.find(
    (p) => normalize(p.expression) === normalize(phrase.expression)
  );
  if (existing) return { success: false, reason: "duplicate" };

  // 日次上限チェック
  const rec = getDailyRecord();
  if (rec.count >= FREE_DAILY_LIMIT) {
    return { success: false, reason: "limit_reached" };
  }

  const newEntry: SavedPhrase = {
    ...phrase,
    id: generateId(),
    savedAt: new Date().toISOString(),
    status: 'learning',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...current]));
  incrementDailyCount();

  return { success: true, phrase: newEntry };
}

export function deletePhrase(id: string): SavedPhrase[] {
  const updated = getVocabulary().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function archivePhrase(id: string): SavedPhrase[] {
  const updated = getVocabulary().map((p) =>
    p.id === id
      ? { ...p, status: 'archived' as const, archivedAt: new Date().toISOString() }
      : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function restorePhrase(id: string): SavedPhrase[] {
  const updated = getVocabulary().map((p) =>
    p.id === id
      ? { ...p, status: 'learning' as const, archivedAt: undefined }
      : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearByStatus(status: 'learning' | 'archived'): SavedPhrase[] {
  const updated = getVocabulary().filter((p) => {
    const s = p.status ?? 'learning';
    return s !== status;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearAll(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isSaved(expression: string): boolean {
  return getVocabulary().some(
    (p) => normalize(p.expression) === normalize(expression)
  );
}

export function getVocabularyCount(): number {
  return getVocabulary().length;
}

// ─── CSV Export ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  phrasal_verb: "句動詞",
  idiom: "イディオム",
  collocation: "コロケーション",
  grammar_pattern: "文法パターン",
};

export function exportToCSV(phrases: SavedPhrase[]): void {
  const headers = [
    "表現", "種類", "CEFRレベル", "意味", "ニュアンス",
    "例文", "文脈", "学習ポイント", "ソースURL", "ステータス", "保存日",
  ];
  const rows = phrases.map((p) => [
    p.expression,
    TYPE_LABELS[p.type] ?? p.type,
    p.cefr_level,
    p.meaning_ja,
    p.nuance,
    p.example,
    p.context,
    p.why_hard_for_japanese,
    p.sourceUrl ?? "",
    (p.status ?? 'learning') === 'archived' ? 'マスター済み' : '学習中',
    new Date(p.savedAt).toLocaleDateString("ja-JP"),
  ]);

  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");

  downloadBlob(csv, `linguist-lens-${todayStr()}.csv`, "text/csv;charset=utf-8");
}

// ─── Markdown (Obsidian) Export ────────────────────────────────────────────

export function exportToMarkdown(phrases: SavedPhrase[]): void {
  const dateISO = todayStr();
  const dateJa = new Date().toLocaleDateString("ja-JP");

  let md = `---
title: LinguistLens マイページ
date: ${dateISO}
tags:
  - 英語学習
  - 語彙
  - LinguistLens
---

# 英語表現リスト

> 合計 **${phrases.length}語** · エクスポート: ${dateJa}

`;

  for (const p of phrases) {
    const type = TYPE_LABELS[p.type] ?? p.type;
    const savedDate = new Date(p.savedAt).toLocaleDateString("ja-JP");

    md += `\n## ${p.expression}\n\n`;
    md += `> **${type}** · CEFR: **${p.cefr_level}** · 保存日: ${savedDate}\n\n`;
    md += `**意味**: ${p.meaning_ja}\n\n`;
    md += `**ニュアンス解説**\n${p.nuance}\n\n`;
    md += `> 💬 *${p.context}*\n\n`;
    md += `**例文**: ${p.example}\n\n`;
    md += `**学習ポイント**: ${p.why_hard_for_japanese}\n\n`;
    if (p.sourceUrl) {
      md += `**ソース**: ${p.sourceUrl}\n\n`;
    }
    md += `---\n`;
  }

  downloadBlob(md, `linguist-lens-${dateISO}.md`, "text/markdown;charset=utf-8");
}

// ─── Shared download helper ────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
