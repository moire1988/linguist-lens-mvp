import type { ExpressionType } from "@/app/actions/analyze";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SavedPhrase {
  id: string;
  expression: string;
  type: ExpressionType;
  cefr_level: string;
  meaning_ja: string;
  nuance: string;
  example: string;
  context: string;
  why_hard_for_japanese: string;
  sourceUrl?: string;
  savedAt: string; // ISO 8601
}

const STORAGE_KEY = "linguist-lens-vocabulary";

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// 大文字小文字・前後スペースを無視した正規化比較
function normalize(s: string): string {
  return s.toLowerCase().trim();
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

export function savePhrase(phrase: Omit<SavedPhrase, "id" | "savedAt">): SavedPhrase {
  const current = getVocabulary();
  // 重複チェック（同じ表現は保存しない）
  const existing = current.find(
    (p) => normalize(p.expression) === normalize(phrase.expression)
  );
  if (existing) return existing;

  const newEntry: SavedPhrase = {
    ...phrase,
    id: generateId(),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...current]));
  return newEntry;
}

export function deletePhrase(id: string): SavedPhrase[] {
  const updated = getVocabulary().filter((p) => p.id !== id);
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

export function exportToCSV(phrases: SavedPhrase[]): void {
  const headers = [
    "表現",
    "種類",
    "CEFRレベル",
    "意味",
    "ニュアンス",
    "例文",
    "文脈",
    "学習ポイント",
    "ソースURL",
    "保存日",
  ];

  const TYPE_LABELS: Record<string, string> = {
    phrasal_verb: "句動詞",
    idiom: "イディオム",
    collocation: "コロケーション",
    grammar_pattern: "文法パターン",
  };

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
    new Date(p.savedAt).toLocaleDateString("ja-JP"),
  ]);

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv =
    "\uFEFF" + // BOM for Excel
    [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `linguist-lens-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
